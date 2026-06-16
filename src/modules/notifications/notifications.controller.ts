import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
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
import { CurrentUser } from '@/modules/auth/decorators/auth.decorator';
import { User } from '@/database/entities/user.entity';
import { UserRole } from '@/database/entities/enums';
import { sanitizeNotificationForTutor } from '@/common/utils/user-privacy.util';

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

  @Get('unread-count/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count for a user' })
  async getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Get('count/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification count for a user' })
  async getCount(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationsService.getCount(userId);
    return { count };
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notifications for a user with relative time' })
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: User,
  ) {
    const notifications =
      await this.notificationsService.findByUserWithRelativeTime(userId);

    if (
      currentUser.role === UserRole.TUTOR &&
      currentUser.id === userId
    ) {
      return notifications.map(sanitizeNotificationForTutor);
    }

    return notifications;
  }

  @Patch(':userId/read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read for a user' })
  async markAllRead(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch('user/:userId/notification/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Delete('user/:userId/notification/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification for a specific user' })
  async delete(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.notificationsService.delete(id, userId);
    return { message: 'Notification deleted successfully' };
  }

  @Delete('user/:userId/non-system')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all non-system notifications for a user' })
  async deleteAllNonSystem(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationsService.deleteAllNonSystem(userId);
    return { message: 'Non-system notifications deleted', count };
  }

  @Delete('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all notifications for a user' })
  async deleteAll(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationsService.deleteAll(userId);
    return { message: 'All notifications deleted', count };
  }

}
