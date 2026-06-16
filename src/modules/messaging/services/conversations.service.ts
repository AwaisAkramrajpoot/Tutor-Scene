import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Conversation } from '@/database/entities/conversation.entity';
import { Message } from '@/database/entities/message.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { sanitizeStudentForTutor } from '@/common/utils/user-privacy.util';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
  ) {}

  /**
   * Find all conversations for a user with metadata (last message, unread count)
   * Requirements: 3.1, 3.2, 3.3, 9.1, 9.2, 9.3
   */
  async findAllForUser(userId: number): Promise<any[]> {
    // Get all active conversations where user is either student or tutor
    const conversations = await this.conversationRepository.find({
      where: [
        { studentId: userId, deletedAt: IsNull() },
        { tutorId: userId, deletedAt: IsNull() },
      ],
      relations: ['student', 'tutor', 'messageRequest'],
      order: {
        lastMessageAt: 'DESC',
      },
    });

    // Enrich each conversation with metadata
    const conversationsWithMetadata = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await this.getUnreadCount(conversation.id, userId);
        const lastMessage = await this.getLastMessage(conversation.id);

        const isTutor = conversation.tutorId === userId;
        return {
          ...conversation,
          student: isTutor
            ? sanitizeStudentForTutor(conversation.student)
            : conversation.student,
          unreadCount,
          lastMessage,
        };
      }),
    );

    return conversationsWithMetadata;
  }

  /**
   * Find a single conversation with access validation
   * Requirements: 3.4
   */
  async findOne(conversationId: number, userId: number): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, deletedAt: IsNull() },
      relations: ['student', 'tutor', 'messageRequest'],
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    // Validate access
    if (!this.validateAccess(conversation, userId)) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    if (conversation.tutorId === userId) {
      conversation.student = sanitizeStudentForTutor(conversation.student);
    }

    return conversation;
  }

  /**
   * Get unread message count for a user in a conversation
   * Requirements: 9.1, 9.2
   */
  async getUnreadCount(conversationId: number, userId: number): Promise<number> {
    return this.messageRepository.count({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
    });
  }

  /**
   * Get the last message in a conversation for preview
   * Requirements: 9.1, 9.3
   */
  async getLastMessage(conversationId: number): Promise<Message | null> {
    return this.messageRepository.findOne({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      relations: ['sender'],
    });
  }

  /**
   * Update the lastMessageAt timestamp for a conversation
   * Requirements: 9.4
   */
  async updateLastMessageAt(conversationId: number): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });
  }

  /**
   * Validate that a user has access to a conversation
   * Requirements: 3.4
   */
  validateAccess(conversation: Conversation, userId: number): boolean {
    return (
      conversation.studentId === userId || conversation.tutorId === userId
    );
  }

  /**
   * Soft delete a conversation
   * Requirements: 8.1
   */
  async softDelete(conversationId: number, userId: number): Promise<void> {
    const conversation = await this.findOne(conversationId, userId);

    await this.conversationRepository.update(conversationId, {
      deletedAt: new Date(),
    });
  }

  /**
   * Get recently contacted tutors for a student
   * Returns the 3 most recently contacted tutors with their information
   */
  async getRecentlyContactedTutors(studentId: number): Promise<any[]> {
    // Get the 3 most recent conversations for the student
    const conversations = await this.conversationRepository.find({
      where: { studentId, deletedAt: IsNull() },
      relations: ['tutor'],
      order: { lastMessageAt: 'DESC' },
      take: 3,
    });

    // Get tutor IDs
    const tutorIds = conversations.map((conv) => conv.tutorId);

    if (tutorIds.length === 0) {
      return [];
    }

    // Fetch prospect information for these tutors
    const prospects = await this.prospectRepository
      .createQueryBuilder('prospect')
      .leftJoinAndSelect('prospect.user', 'user')
      .where('prospect.userId IN (:...tutorIds)', { tutorIds })
      .getMany();

    // Create a map for quick lookup
    const prospectMap = new Map(
      prospects.map((p) => [p.userId, p])
    );

    // Combine conversation and prospect data
    return conversations.map((conversation) => {
      const prospect = prospectMap.get(conversation.tutorId);
      return {
        tutorId: conversation.tutorId,
        conversationId: conversation.id,
        lastMessageAt: conversation.lastMessageAt,
        tutor: {
          id: conversation.tutor.id,
          firstName: conversation.tutor.firstName,
          lastName: conversation.tutor.lastName,
          email: conversation.tutor.email,
          profilePhotoUrl: conversation.tutor.profilePhotoUrl,
        },
        prospectInfo: prospect ? {
          id: prospect.id,
          subjects: prospect.subjects,
          gradeLevels: prospect.gradeLevels,
          yearsOfExperience: prospect.yearsOfExperience,
          fee: prospect.fee,
          profilePic: prospect.profilePic,
          fullName: prospect.fullName,
        } : null,
      };
    });
  }
}
