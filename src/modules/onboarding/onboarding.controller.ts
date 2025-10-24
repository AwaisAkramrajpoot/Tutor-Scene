import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { OnboardingService } from './services/onboarding.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { OnboardingResponseDto } from './dto/onboarding-response.dto';
import { Prospect } from '@/database/entities/prospect.entity';
import { FileUploadDto, FileType } from './dto/file-upload.dto';

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
      
      return {
        prospect,
        message: 'Tutor onboarding initiated successfully',
      };
    } catch (error) {
      this.logger.error('Tutor onboarding failed', error.stack);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Tutor onboarding failed');
    }
  }

  @Post('tutor/:id/file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload tutor file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', type: OnboardingResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Prospect not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        fileType: {
          type: 'string',
          enum: [FileType.CV, FileType.INTRO_VIDEO, FileType.GOV_ID],
        }
      }
    }
  })
  async uploadTutorFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: MulterFile,
    @Body() fileUploadDto: FileUploadDto,
  ): Promise<OnboardingResponseDto> {
    try {
      // S3 bucket URL - in a real implementation, this would come from config
      const s3BucketUrl = process.env.S3_BUCKET_URL || 'https://my-bucket.s3.amazonaws.com';
      
      // Store file in S3
      const fileUrl = await this.onboardingService.storeFileInS3(
        file.buffer,
        file.originalname,
        file.mimetype,
        s3BucketUrl,
      );
      
      // Update prospect with file URL
      const prospect = await this.onboardingService.updateProspectWithFile(
        id,
        fileUrl,
        fileUploadDto.fileType,
      );
      
      return {
        prospect,
        message: `File uploaded successfully as ${fileUploadDto.fileType}`,
      };
    } catch (error) {
      this.logger.error('File upload failed', error.stack);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('File upload failed');
    }
  }
}