import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { Notification } from '@/database/entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly configService: ConfigService,
  ) {
    sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
  }

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createDto);
    const saved = await this.notificationRepository.save(notification);

    // Send notification via email if channel is EMAIL
    if (createDto.channel === 'EMAIL') {
      await this.sendEmail(saved);
    }

    return saved;
  }

  private async sendEmail(notification: Notification) {
    // Implementation would fetch user email and send
    const msg = {
      to: 'user@example.com', // Replace with actual user email lookup
      from: this.configService.get<string>('SENDGRID_FROM_EMAIL'),
      subject: notification.title,
      text: notification.message,
    };

    try {
      await sgMail.send(msg);
      notification.isSent = true;
      await this.notificationRepository.save(notification);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async findByUser(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({ where: { userId, isRead: false } });
  }

  /**
   * Mark all unread notifications as read for a user by action URL
   * Used when user views a conversation to mark related notifications as read
   */
  async markAsReadByActionUrl(userId: number, actionUrl: string): Promise<number> {
    const result = await this.notificationRepository.update(
      {
        userId,
        actionUrl,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return result.affected || 0;
  }
}
