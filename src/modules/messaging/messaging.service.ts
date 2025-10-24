import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '@/database/entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async sendMessage(sendMessageDto: SendMessageDto, senderId: number): Promise<Message> {
    const message = this.messageRepository.create({
      ...sendMessageDto,
      senderId,
    });
    return this.messageRepository.save(message);
  }

  async getConversation(userId: number, otherUserId: number): Promise<Message[]> {
    return this.messageRepository.find({
      where: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async getAllMessages(userId: number): Promise<Message[]> {
    return this.messageRepository.find({
      where: [{ senderId: userId }, { receiverId: userId }],
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(messageId: number): Promise<Message> {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }
    message.isRead = true;
    message.readAt = new Date();
    return this.messageRepository.save(message);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.messageRepository.count({
      where: { receiverId: userId, isRead: false },
    });
  }
}
