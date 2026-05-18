import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorator';
import { User } from '@/database/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OnboardingService } from './services/onboarding.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { OnboardingResponseDto } from './dto/onboarding-response.dto';
import { Public } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Prospect } from '@/database/entities/prospect.entity';
import { UserRole } from '@/database/entities/enums';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('tutor')
  @ApiOperation({ summary: 'Tutor onboarding' })
  @ApiResponse({ status: 201, description: 'Tutor onboarding initiated successfully', type: OnboardingResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiConsumes('application/json')
  async tutorOnboarding(
    @Body() onboardingDto: OnboardingDto,
  ): Promise<OnboardingResponseDto> {
    try {
      // Save prospect information
      const prospect = await this.onboardingService.processTutorOnboarding(onboardingDto);
      const published = await this.onboardingService.getPublishedProspectByUserId(
        onboardingDto.userId,
      );

      return {
        prospect,
        publishedProspectId: published?.id ?? prospect.id,
        hasPendingProfileUpdate: Boolean(prospect.parentProspectId),
        message: prospect.parentProspectId
          ? 'Profile updates submitted for admin review'
          : 'Tutor onboarding initiated successfully',
      };
    } catch (error) {
      this.logger.error('Tutor onboarding failed', error.stack);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Tutor onboarding failed');
    }
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload file to S3 and return URL' })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://my-bucket.s3.amazonaws.com/file-123456.pdf' },
        message: { type: 'string', example: 'File uploaded successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - No file provided or invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        }
      }
    }
  })
  async uploadFile(
    @UploadedFile() file: MulterFile,
  ): Promise<{ url: string; message: string }> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      // S3 bucket URL - in a real implementation, this would come from config
      const s3BucketUrl = process.env.S3_BUCKET_URL || 'https://my-bucket.s3.amazonaws.com';
      
      // Store file in S3
      const fileUrl = await this.onboardingService.storeFileInS3(
        file.buffer,
        file.originalname,
        file.mimetype,
        s3BucketUrl,
      );
      
      return {
        url: fileUrl,
        message: 'File uploaded successfully',
      };
    } catch (error) {
      this.logger.error('File upload failed', error.stack);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('File upload failed');
    }
  }

  @Get('status/:userId')
  @ApiOperation({ summary: 'Get prospect status by user ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Prospect status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          enum: ['not_started', 'pending', 'awaiting_interview', 'active', 'suspended'],
          example: 'not_started' 
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getProspectStatus(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{ status: string }> {
    try {
      return await this.onboardingService.getProspectStatusByUserId(userId);
    } catch (error) {
      this.logger.error(`Failed to get prospect status for user ${userId}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve prospect status');
    }
  }

  @Get('tutors/list')
  @ApiOperation({ summary: 'Get list of tutors/prospects with optional status filter' })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: ['pending', 'active', 'suspended', 'all'], 
    description: 'Filter by status (use "all" to get all records regardless of status)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tutors list retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        prospects: {
          type: 'array',
          items: {
            type: 'object'
          }
        },
        count: {
          type: 'number',
          example: 10
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTutorsList(
    @Query('status') status?: string,
  ): Promise<{ prospects: Prospect[]; count: number }> {
    try {
      const prospects = await this.onboardingService.getTutorsList(status);
      return {
        prospects,
        count: prospects.length,
      };
    } catch (error) {
      this.logger.error('Failed to get tutors list', error.stack);
      throw new InternalServerErrorException('Failed to retrieve tutors list');
    }
  }

  @Get('tutor')
  @ApiOperation({ summary: 'Search for active tutors with filters' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tutors search results',
    schema: {
      type: 'object',
      properties: {
        tutors: {
          type: 'array',
          items: {
            type: 'object'
          }
        },
        count: {
          type: 'number',
          example: 5
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async searchTutors(
    @Query('subject') subject?: string,
    @Query('priceRange') priceRange?: string,
    @Query('availability') availability?: string,
    @Query('searchString') searchString?: string,
    @Query('level') level?: string,
    @Query('minFee') minFee?: string,
    @Query('maxFee') maxFee?: string,
  ): Promise<{ tutors: Prospect[]; count: number }> {
    try {
      const tutors = await this.onboardingService.searchTutors(
        subject,
        priceRange,
        availability,
        searchString,
        level,
        minFee,
        maxFee,
      );
      return {
        tutors,
        count: tutors.length,
      };
    } catch (error) {
      this.logger.error('Failed to search tutors', error.stack);
      throw new InternalServerErrorException('Failed to search tutors');
    }
  }

  @Post('tutor/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve tutor and create Stripe accounts (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tutor approved successfully',
    schema: {
      type: 'object',
      properties: {
        prospect: { type: 'object' },
        message: { type: 'string', example: 'Tutor approved successfully' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Tutor not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async approveTutor(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ prospect: Prospect; message: string }> {
    try {
      const prospect = await this.onboardingService.approveTutor(id);
      return {
        prospect,
        message: 'Tutor approved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to approve tutor with ID ${id}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to approve tutor');
    }
  }

  @Get('stripe-onboarding-link/:userId')
  @ApiOperation({ summary: 'Get Stripe Connect onboarding link for tutor' })
  @ApiResponse({ 
    status: 200, 
    description: 'Onboarding link generated successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://connect.stripe.com/setup/...' },
        message: { type: 'string', example: 'Onboarding link generated successfully' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Prospect not found for user' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStripeOnboardingLink(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{ url: string; message: string }> {
    try {
      const url = await this.onboardingService.generateStripeOnboardingLink(userId);
      return {
        url,
        message: 'Onboarding link generated successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to generate onboarding link for user ${userId}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate onboarding link');
    }
  }

  @Get('payment-onboarded/:userId')
  @ApiOperation({ summary: 'Check if tutor has completed payment onboarding' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment onboarding status retrieved',
    schema: {
      type: 'object',
      properties: {
        paymentOnBoarded: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Prospect not found for user' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPaymentOnboardingStatus(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{ paymentOnBoarded: boolean }> {
    try {
      return await this.onboardingService.getPaymentOnboardingStatus(userId);
    } catch (error) {
      this.logger.error(`Failed to get payment onboarding status for user ${userId}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve payment onboarding status');
    }
  }

  @Get('tutor/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user tutor prospect profile' })
  @ApiResponse({ status: 200, description: 'Prospect profile or null' })
  async getMyTutorProspect(@CurrentUser() user: User) {
    const prospect = await this.onboardingService.getProspectByUserId(user.id);
    return { prospect };
  }

  @Get('tutor/:id')
  @ApiOperation({ summary: 'Get tutor/prospect by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tutor retrieved successfully',
    type: Prospect
  })
  @ApiResponse({ status: 404, description: 'Tutor not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTutorById(
    @Param('id', ParseIntPipe) id: number,
    @Query('admin') admin?: string,
  ) {
    try {
      const prospect = await this.onboardingService.getTutorById(
        id,
        admin === 'true',
      );
      const meta = await this.onboardingService.getLearnerMetaForProspect(prospect);
      return { ...(prospect as any), ...meta };
    } catch (error) {
      this.logger.error(`Failed to get tutor with ID ${id}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve tutor');
    }
  }

  @Get('tutor/:tutorId/payment-status')
  @ApiOperation({ summary: 'Get payment onboarding status by tutor ID (prospect user_id)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment onboarding status retrieved',
    schema: {
      type: 'object',
      properties: {
        paymentOnBoarded: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Prospect not found for tutor' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPaymentStatusByTutorId(
    @Param('tutorId', ParseIntPipe) tutorId: number,
  ): Promise<{ paymentOnBoarded: boolean }> {
    try {
      return await this.onboardingService.getPaymentOnboardingStatus(tutorId);
    } catch (error) {
      this.logger.error(`Failed to get payment status for tutor ${tutorId}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve payment onboarding status');
    }
  }

  @Get('prospects/ids')
  @ApiOperation({ summary: 'Get all prospects with their IDs (for debugging)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of prospects with both id and prospectId',
  })
  async getProspectIds() {
    try {
      const prospects = await this.onboardingService.getAllProspectsWithIds();
      return prospects;
    } catch (error) {
      this.logger.error('Failed to get prospect IDs', error.stack);
      throw new InternalServerErrorException('Failed to retrieve prospect IDs');
    }
  }
}
