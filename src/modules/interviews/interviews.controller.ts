import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/auth.decorator';
import { UserRole } from '@/database/entities/enums';
import { User } from '@/database/entities/user.entity';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { UpdateInterviewStatusDto } from './dto/update-interview-status.dto';
import { InterviewResponseDto } from './dto/interview-response.dto';
import { GetInterviewsQueryDto } from './dto/get-interviews-query.dto';

@ApiTags('Interviews')
@ApiBearerAuth()
@Controller('interviews')
@UseGuards(RolesGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post('schedule-interview')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Schedule a Zoom interview with a pending prospect',
    description:
      'Creates a Zoom meeting for interviewing a prospect. Only admins can schedule interviews. The prospect must have a "pending" status and cannot have an existing scheduled interview.',
  })
  @ApiBody({
    type: ScheduleInterviewDto,
    examples: {
      scheduleInterview: {
        summary: 'Schedule interview example',
        description: 'Example request to schedule an interview for a prospect',
        value: {
          userId: 123,
          startTime: '2024-01-15T10:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Interview successfully scheduled',
    type: InterviewResponseDto,
    schema: {
      example: {
        id: 1,
        userId: 123,
        startTime: '2024-01-15T10:00:00.000Z',
        zoomMeetingId: '123456789',
        hostStartUrl: 'https://zoom.us/s/123456789?zak=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        participantJoinUrl: 'https://zoom.us/j/123456789',
        meetingPassword: 'abc123',
        status: 'scheduled',
        createdAt: '2024-01-14T15:30:00.000Z',
        updatedAt: '2024-01-14T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Interview already scheduled for this prospect',
    schema: {
      example: {
        statusCode: 400,
        message: 'Interview already scheduled for this prospect',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Pending prospect not found for this user',
    schema: {
      example: {
        statusCode: 404,
        message: 'Pending prospect not found for this user',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to create Zoom meeting or schedule interview',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to schedule interview',
        error: 'Internal Server Error',
      },
    },
  })
  async scheduleInterview(
    @Body() scheduleInterviewDto: ScheduleInterviewDto,
  ): Promise<InterviewResponseDto> {
    return this.interviewsService.scheduleInterview(
      scheduleInterviewDto.userId,
      new Date(scheduleInterviewDto.startTime),
    );
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all interviews (Admin only)',
    description:
      'Retrieves all interviews with optional status filtering. Only admins can access this endpoint. By default, returns all interviews regardless of status.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['scheduled', 'completed', 'cancelled'],
    description: 'Filter interviews by status (optional)',
    example: 'scheduled',
  })
  @ApiResponse({
    status: 200,
    description: 'List of interviews retrieved successfully',
    type: [InterviewResponseDto],
    schema: {
      example: [
        {
          id: 1,
          userId: 123,
          startTime: '2024-01-15T10:00:00.000Z',
          zoomMeetingId: '123456789',
          hostStartUrl: 'https://zoom.us/s/123456789?zak=...',
          participantJoinUrl: 'https://zoom.us/j/123456789',
          meetingPassword: 'abc123',
          status: 'scheduled',
          createdAt: '2024-01-14T15:30:00.000Z',
          updatedAt: '2024-01-14T15:30:00.000Z',
        },
        {
          id: 2,
          userId: 456,
          startTime: '2024-01-16T14:00:00.000Z',
          zoomMeetingId: '987654321',
          hostStartUrl: 'https://zoom.us/s/987654321?zak=...',
          participantJoinUrl: 'https://zoom.us/j/987654321',
          meetingPassword: 'xyz789',
          status: 'completed',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-16T15:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  async getAllInterviews(
    @Query() query: GetInterviewsQueryDto,
  ): Promise<InterviewResponseDto[]> {
    return this.interviewsService.getAllInterviews(query.status);
  }

  @Get('my-interview')
  @ApiOperation({
    summary: 'Get my interview (Tutor)',
    description:
      'Retrieves the authenticated tutor\'s interview details. Tutors can only access their own interview data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Interview details retrieved successfully',
    type: InterviewResponseDto,
    schema: {
      example: {
        id: 1,
        userId: 123,
        startTime: '2024-01-15T10:00:00.000Z',
        zoomMeetingId: '123456789',
        hostStartUrl: 'https://zoom.us/s/123456789?zak=...',
        participantJoinUrl: 'https://zoom.us/j/123456789',
        meetingPassword: 'abc123',
        status: 'scheduled',
        createdAt: '2024-01-14T15:30:00.000Z',
        updatedAt: '2024-01-14T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Interview not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Interview not found',
        error: 'Not Found',
      },
    },
  })
  async getMyInterview(
    @CurrentUser() user: User,
  ): Promise<InterviewResponseDto> {
    return this.interviewsService.getMyInterview(user.id);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get interview details by user ID',
    description:
      'Retrieves interview details for a specific user. Admins can access any user\'s interview, while regular users can only access their own interview data.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user whose interview to retrieve',
    type: Number,
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Interview details retrieved successfully',
    type: InterviewResponseDto,
    schema: {
      example: {
        id: 1,
        userId: 123,
        startTime: '2024-01-15T10:00:00.000Z',
        zoomMeetingId: '123456789',
        hostStartUrl: 'https://zoom.us/s/123456789?zak=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        participantJoinUrl: 'https://zoom.us/j/123456789',
        meetingPassword: 'abc123',
        status: 'scheduled',
        createdAt: '2024-01-14T15:30:00.000Z',
        updatedAt: '2024-01-14T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot access another user\'s interview data',
    schema: {
      example: {
        statusCode: 403,
        message: 'Cannot access another user\'s interview data',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Interview not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Interview not found',
        error: 'Not Found',
      },
    },
  })
  async getInterviewByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ): Promise<InterviewResponseDto> {
    // Authorization check: admin or own data
    if (user.role !== UserRole.ADMIN && user.id !== userId) {
      throw new ForbiddenException('Cannot access another user\'s interview data');
    }

    return this.interviewsService.getInterviewByUserId(userId);
  }

  @Get(':id/host-url')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get host start URL for an interview',
    description:
      'Retrieves the Zoom host start URL for admins to start the interview meeting. Only available for interviews with "scheduled" status. Admin-only access.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the interview',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Host start URL retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        hostStartUrl: {
          type: 'string',
          example: 'https://zoom.us/s/123456789?zak=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      example: {
        hostStartUrl: 'https://zoom.us/s/123456789?zak=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot access meeting URLs for cancelled/completed interviews',
    schema: {
      example: {
        statusCode: 400,
        message: 'Cannot access meeting URLs for cancelled/completed interviews',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Interview not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Interview not found',
        error: 'Not Found',
      },
    },
  })
  async getHostStartUrl(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ hostStartUrl: string }> {
    return this.interviewsService.getHostStartUrl(id);
  }

  @Get(':id/join-url')
  @ApiOperation({
    summary: 'Get participant join URL for an interview',
    description:
      'Retrieves the Zoom participant join URL for prospects to join the interview meeting. Only available for interviews with "scheduled" status. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the interview',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Participant join URL retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        participantJoinUrl: {
          type: 'string',
          example: 'https://zoom.us/j/123456789',
        },
      },
      example: {
        participantJoinUrl: 'https://zoom.us/j/123456789',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot access meeting URLs for cancelled/completed interviews',
    schema: {
      example: {
        statusCode: 400,
        message: 'Cannot access meeting URLs for cancelled/completed interviews',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Interview not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Interview not found',
        error: 'Not Found',
      },
    },
  })
  async getParticipantJoinUrl(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ participantJoinUrl: string }> {
    return this.interviewsService.getParticipantJoinUrl(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update interview status',
    description:
      'Updates the status of an interview. Only admins can update interview status. Valid transitions are: scheduled → completed, scheduled → cancelled. The updatedAt timestamp is automatically updated.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the interview to update',
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: UpdateInterviewStatusDto,
    examples: {
      markCompleted: {
        summary: 'Mark interview as completed',
        description: 'Update interview status to completed after the interview is finished',
        value: {
          status: 'completed',
        },
      },
      markCancelled: {
        summary: 'Mark interview as cancelled',
        description: 'Update interview status to cancelled if the interview needs to be cancelled',
        value: {
          status: 'cancelled',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Interview status updated successfully',
    type: InterviewResponseDto,
    schema: {
      example: {
        id: 1,
        userId: 123,
        startTime: '2024-01-15T10:00:00.000Z',
        zoomMeetingId: '123456789',
        hostStartUrl: 'https://zoom.us/s/123456789?zak=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        participantJoinUrl: 'https://zoom.us/j/123456789',
        meetingPassword: 'abc123',
        status: 'completed',
        createdAt: '2024-01-14T15:30:00.000Z',
        updatedAt: '2024-01-15T11:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid status transition',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Interview not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Interview not found',
        error: 'Not Found',
      },
    },
  })
  async updateInterviewStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInterviewStatusDto: UpdateInterviewStatusDto,
  ): Promise<InterviewResponseDto> {
    return this.interviewsService.updateInterviewStatus(
      id,
      updateInterviewStatusDto.status,
    );
  }
}
