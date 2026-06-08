import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Notification } from '@/database/entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const isSystem =
      createDto.isSystem ??
      (/tutor scene/i.test(createDto.notification || '') ||
        /tutor scene/i.test(createDto.title || ''));

    const notification = this.notificationRepository.create({
      userId: createDto.userId,
      notification: createDto.notification,
      title: createDto.title ?? this.inferTitle(createDto),
      preview: createDto.preview ?? createDto.notification,
      type: createDto.type ?? this.inferType(createDto.notification),
      isSystem,
      metadata: createDto.metadata ?? null,
      isRead: false,
    });
    return await this.notificationRepository.save(notification);
  }

  private inferTitle(dto: CreateNotificationDto): string {
    if (dto.type === 'message') {
      if (/message request/i.test(dto.notification || '')) {
        return 'Message from Learner';
      }
      return 'Message from Tutor';
    }
    if (dto.type === 'booking_confirmation') return 'Booking Confirmation';
    if (dto.type === 'booking_request') return 'New Booking Request';
    if (dto.type === 'cancellation') return 'Cancellation Alert';
    if (dto.type === 'session_reminder') return 'Session Reminder';
    if (dto.type === 'support') return 'Tutor Scene Support';
    const text = dto.notification || '';
    if (/message request/i.test(text)) return 'Message from Learner';
    if (/new message from/i.test(text)) return 'Message from Tutor';
    if (/booking request/i.test(text)) return 'New Booking Request';
    if (/accepted|confirmed/i.test(text)) return 'Booking Confirmation';
    if (/cancel/i.test(text)) return 'Cancellation Alert';
    if (/reminder/i.test(text)) return 'Session Reminder';
    if (/tutor scene/i.test(text)) return 'Tutor Scene Support';
    return 'Notification';
  }

  private inferType(text: string): string {
    if (/message request/i.test(text)) return 'message';
    if (/new message from/i.test(text)) return 'message';
    if (/booking request/i.test(text)) return 'booking_request';
    if (/accepted|confirmed/i.test(text)) return 'booking_confirmation';
    if (/cancel/i.test(text)) return 'cancellation';
    if (/reminder/i.test(text)) return 'session_reminder';
    if (/tutor scene/i.test(text)) return 'support';
    return 'general';
  }

  async findByUser(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserWithRelativeTime(
    userId: number,
  ): Promise<Array<Notification & { relativeTime: string }>> {
    const notifications = await this.findByUser(userId);
    return notifications.map((notification) => ({
      ...notification,
      relativeTime: this.getRelativeTime(notification.createdAt),
    }));
  }

  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - new Date(date).getTime()) / 1000,
    );

    if (diffInSeconds < 60) return 'Just now';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d`;

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { updated: result.affected || 0 };
  }

  async delete(id: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    if (notification.isSystem) {
      throw new NotFoundException('System notifications cannot be deleted');
    }

    await this.notificationRepository.remove(notification);
  }

  async deleteAllNonSystem(userId: number): Promise<number> {
    const result = await this.notificationRepository.delete({
      userId,
      isSystem: false,
    });
    return result.affected || 0;
  }

  async deleteAll(userId: number): Promise<number> {
    const result = await this.notificationRepository.delete({ userId });
    return result.affected || 0;
  }

  async getCount(userId: number): Promise<number> {
    return this.notificationRepository.count({ where: { userId } });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }
}
