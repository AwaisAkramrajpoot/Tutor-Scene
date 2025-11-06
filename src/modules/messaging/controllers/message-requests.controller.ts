import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MessageRequestsService } from '../services/message-requests.service';
import { CreateMessageRequestDto } from '../dto/create-message-request.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/auth.decorator';
import { User } from '@/database/entities/user.entity';
import { UserRole } from '@/database/entities/enums';

@ApiTags('Message Requests')
@Controller('message-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MessageRequestsController {
  constructor(
    private readonly messageRequestsService: MessageRequestsService,
  ) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 requests per hour
  @ApiOperation({ 
    summary: 'Create a new message request (students only)',
    description: 'Rate limited to 10 requests per hour to prevent spam'
  })
  @ApiResponse({
    status: 201,
    description: 'Message request successfully created',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or tutor not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Only students can create message requests',
  })
  @ApiResponse({
    status: 409,
    description: 'A message request already exists for this tutor',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  async create(
    @CurrentUser() user: User,
    @Body() createMessageRequestDto: CreateMessageRequestDto,
  ) {
    return this.messageRequestsService.create(
      user.id,
      createMessageRequestDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get message requests for current user' })
  @ApiResponse({
    status: 200,
    description:
      'Returns pending requests for tutors, all requests for students',
  })
  async findAll(@CurrentUser() user: User) {
    if (user.role === UserRole.TUTOR) {
      return this.messageRequestsService.findAllForTutor(user.id);
    } else if (user.role === UserRole.STUDENT) {
      return this.messageRequestsService.findAllForStudent(user.id);
    }
    return [];
  }

  @Patch(':id/accept')
  @Roles(UserRole.TUTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a message request (tutors only)' })
  @ApiResponse({
    status: 200,
    description: 'Message request accepted and conversation created',
  })
  @ApiResponse({
    status: 400,
    description: 'Request cannot be accepted (invalid status)',
  })
  @ApiResponse({
    status: 403,
    description: 'Only tutors can accept message requests',
  })
  @ApiResponse({
    status: 404,
    description: 'Message request not found',
  })
  async accept(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.messageRequestsService.accept(id, user.id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.TUTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a message request (tutors only)' })
  @ApiResponse({
    status: 200,
    description: 'Message request rejected',
  })
  @ApiResponse({
    status: 400,
    description: 'Request cannot be rejected (invalid status)',
  })
  @ApiResponse({
    status: 403,
    description: 'Only tutors can reject message requests',
  })
  @ApiResponse({
    status: 404,
    description: 'Message request not found',
  })
  async reject(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.messageRequestsService.reject(id, user.id);
  }
}
