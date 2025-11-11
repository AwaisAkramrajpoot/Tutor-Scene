import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a notification' })
  @ApiResponse({ status: 201, description: 'Notification created' })
  async create(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.create(createDto);
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all notifications for a user with relative time',
  })
  @ApiResponse({
    status: 200,
    description: 'List of notifications with relative time',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          userId: { type: 'number' },
          notification: {
            type: 'string',
            example: 'New booking request from Alex Johnson',
          },
          createdAt: { type: 'string', format: 'date-time' },
          relativeTime: { type: 'string', example: '30 minutes ago' },
        },
      },
    },
  })
  async findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationsService.findByUserWithRelativeTime(userId);
  }

  @Delete('user/:userId/notification/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification for a specific user' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async delete(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.notificationsService.delete(id, userId);
    return { message: 'Notification deleted successfully' };
  }

  @Delete('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all notifications for a user' })
  @ApiResponse({ status: 200, description: 'All notifications deleted' })
  async deleteAll(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationsService.deleteAll(userId);
    return { message: 'All notifications deleted', count };
  }

  @Get('count/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification count for a user' })
  @ApiResponse({ status: 200, description: 'Notification count' })
  async getCount(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationsService.getCount(userId);
    return { count };
  }
}
