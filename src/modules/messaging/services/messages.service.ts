import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '@/database/entities/message.entity';
import { Conversation } from '@/database/entities/conversation.entity';
import { User } from '@/database/entities/user.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
import { NotificationsService } from '@/modules/notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new message in a conversation
   * Requirements: 4.1, 4.2, 4.5, 13.1, 13.3
   */
  async create(
    conversationId: number,
    senderId: number,
    dto: CreateMessageDto,
    isReceiverOnline?: boolean,
  ): Promise<Message> {
    // Validate conversation exists and user is participant
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['student', 'tutor'],
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    // Validate user is conversation participant
    if (
      conversation.studentId !== senderId &&
      conversation.tutorId !== senderId
    ) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Determine receiver ID and get sender/receiver info
    const receiverId =
      conversation.studentId === senderId
        ? conversation.tutorId
        : conversation.studentId;

    const sender = conversation.studentId === senderId 
      ? conversation.student 
      : conversation.tutor;
    
    const receiver = conversation.studentId === senderId 
      ? conversation.tutor 
      : conversation.student;

    // Create the message
    const message = this.messageRepository.create({
      conversationId,
      senderId,
      receiverId,
      content: dto.content,
      attachmentUrl: dto.attachmentUrl,
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation lastMessageAt timestamp
    await this.conversationRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });

    // Create notification if receiver is offline
    // Requirements: 13.1, 13.3
    if (isReceiverOnline === false) {
      // Create message preview (truncate if too long)
      const messagePreview = dto.content.length > 100 
        ? dto.content.substring(0, 100) + '...' 
        : dto.content;

      const messageTitle =
        receiverId === conversation.tutorId
          ? 'Message from Learner'
          : 'Message from Tutor';

      await this.notificationsService.create({
        userId: receiverId,
        notification: `New message from ${sender.firstName} ${sender.lastName}: ${messagePreview}`,
        title: messageTitle,
        preview: messagePreview,
        type: 'message',
        metadata: { conversationId },
      });
    }

    return savedMessage;
  }

  /**
   * Find messages by conversation with pagination
   * Requirements: 4.3, 8.2
   */
  async findByConversation(
    conversationId: number,
    userId: number,
    query: MessageQueryDto,
  ): Promise<{ messages: Message[]; total: number; page: number; limit: number }> {
    // Validate conversation exists and user is participant
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    // Validate user is conversation participant
    if (
      conversation.studentId !== userId &&
      conversation.tutorId !== userId
    ) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    // Get paginated messages ordered by createdAt ascending
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversationId },
      relations: ['sender', 'receiver'],
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });

    return {
      messages,
      total,
      page,
      limit,
    };
  }

  /**
   * Mark messages as read for a user in a conversation
   * Requirements: 4.4, 6.1, 6.3
   */
  async markAsRead(conversationId: number, userId: number): Promise<number> {
    // Validate conversation exists and user is participant
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    // Validate user is conversation participant
    if (
      conversation.studentId !== userId &&
      conversation.tutorId !== userId
    ) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Mark all unread messages from other participant as read
    const result = await this.messageRepository.update(
      {
        conversationId,
        receiverId: userId,
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
