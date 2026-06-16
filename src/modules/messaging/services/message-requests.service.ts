import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { MessageRequest } from '@/database/entities/message-request.entity';
import { Conversation } from '@/database/entities/conversation.entity';
import { User } from '@/database/entities/user.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { MessageRequestStatus, UserRole } from '@/database/entities/enums';
import { CreateMessageRequestDto } from '../dto/create-message-request.dto';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { sanitizeStudentForTutor } from '@/common/utils/user-privacy.util';

@Injectable()
export class MessageRequestsService {
  constructor(
    @InjectRepository(MessageRequest)
    private readonly messageRequestRepository: Repository<MessageRequest>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new message request with duplicate validation
   * Requirements: 1.1, 1.2, 7.2
   */
  async create(
    studentId: number,
    dto: CreateMessageRequestDto,
  ): Promise<MessageRequest> {
    // First, find the prospect record using dto.tutorId
    const prospect = await this.prospectRepository.findOne({
      where: { id: dto.tutorId },
    });

    if (!prospect) {
      throw new NotFoundException(`Prospect with ID ${dto.tutorId} not found`);
    }

    if (!prospect.userId) {
      throw new BadRequestException(
        'Prospect does not have an associated user account',
      );
    }

    // Now find the tutor user using the prospect's userId
    const tutor = await this.userRepository.findOne({
      where: { id: prospect.userId },
    });

    if (!tutor) {
      throw new NotFoundException(
        `Tutor user with ID ${prospect.userId} not found`,
      );
    }

    if (tutor.role !== UserRole.TUTOR) {
      throw new BadRequestException(
        'Message requests can only be sent to users with tutor role',
      );
    }

    // Check for existing pending or accepted requests using the tutor's user ID
    const existingRequest = await this.checkExistingRequest(
      studentId,
      tutor.id,
    );

    if (existingRequest) {
      throw new ConflictException(
        `A ${existingRequest.status} message request already exists for this tutor`,
      );
    }

    // Get student details for notification
    const student = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Create the message request with the tutor's user ID
    const messageRequest = this.messageRequestRepository.create({
      studentId,
      tutorId: tutor.id,
      message: dto.message,
      status: MessageRequestStatus.PENDING,
    });

    const savedRequest = await this.messageRequestRepository.save(messageRequest);

    // Create notification for tutor (first name only — last name is admin-only)
    await this.notificationsService.create({
      userId: tutor.id,
      notification: `${student.firstName} has sent you a message request`,
      title: 'Message from Learner',
      preview: 'A learner wants to start a conversation with you.',
      type: 'message',
      metadata: {
        messageRequestId: savedRequest.id,
        studentId: studentId,
      },
    });

    return savedRequest;
  }

  /**
   * Check for existing pending or accepted requests between student and tutor
   */
  private async checkExistingRequest(
    studentId: number,
    tutorId: number,
  ): Promise<MessageRequest | null> {
    return this.messageRequestRepository.findOne({
      where: {
        studentId,
        tutorId,
        status: In([MessageRequestStatus.PENDING, MessageRequestStatus.ACCEPTED]),
      },
    });
  }

  /**
   * Get all message requests for a tutor (pending requests)
   * Requirements: 1.3
   */
  async findAllForTutor(tutorId: number): Promise<MessageRequest[]> {
    const requests = await this.messageRequestRepository.find({
      where: {
        tutorId,
        status: MessageRequestStatus.PENDING,
      },
      relations: ['student'],
      order: {
        createdAt: 'DESC',
      },
    });

    return requests.map((request) => ({
      ...request,
      student: sanitizeStudentForTutor(request.student),
    }));
  }

  /**
   * Get all message requests for a student (all statuses)
   * Requirements: 1.4
   */
  async findAllForStudent(studentId: number): Promise<MessageRequest[]> {
    return this.messageRequestRepository.find({
      where: {
        studentId,
      },
      relations: ['tutor'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Accept a message request and create a conversation
   * Requirements: 2.1, 2.4
   */
  async accept(
    requestId: number,
    tutorId: number,
  ): Promise<{ request: MessageRequest; conversation: Conversation }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the message request
      const messageRequest = await queryRunner.manager.findOne(MessageRequest, {
        where: { id: requestId },
        relations: ['student', 'tutor'],
      });

      if (!messageRequest) {
        throw new NotFoundException(
          `Message request with ID ${requestId} not found`,
        );
      }

      // Validate that the tutor is the recipient
      if (messageRequest.tutorId !== tutorId) {
        throw new ForbiddenException(
          'You are not authorized to accept this message request',
        );
      }

      // Validate that the request is pending
      if (messageRequest.status !== MessageRequestStatus.PENDING) {
        throw new BadRequestException(
          `Cannot accept a message request with status: ${messageRequest.status}`,
        );
      }

      // Update the message request status
      messageRequest.status = MessageRequestStatus.ACCEPTED;
      const updatedRequest = await queryRunner.manager.save(messageRequest);

      // Create the conversation
      const conversation = queryRunner.manager.create(Conversation, {
        messageRequestId: messageRequest.id,
        studentId: messageRequest.studentId,
        tutorId: messageRequest.tutorId,
        lastMessageAt: null,
      });

      const savedConversation = await queryRunner.manager.save(conversation);

      await queryRunner.commitTransaction();

      // Create notification for student (outside transaction)
      const tutor = messageRequest.tutor;
      if (tutor) {
        await this.notificationsService.create({
          userId: messageRequest.studentId,
          notification: `Your message request has been accepted by ${tutor.firstName} ${tutor.lastName}`,
          title: 'Message from Tutor',
          preview: 'Your message request was accepted. You can now chat.',
          type: 'message',
        });
      }

      return {
        request: updatedRequest,
        conversation: savedConversation,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reject a message request
   * Requirements: 2.2
   */
  async reject(requestId: number, tutorId: number): Promise<MessageRequest> {
    // Find the message request
    const messageRequest = await this.messageRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!messageRequest) {
      throw new NotFoundException(
        `Message request with ID ${requestId} not found`,
      );
    }

    // Validate that the tutor is the recipient
    if (messageRequest.tutorId !== tutorId) {
      throw new ForbiddenException(
        'You are not authorized to reject this message request',
      );
    }

    // Validate that the request is pending
    if (messageRequest.status !== MessageRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject a message request with status: ${messageRequest.status}`,
      );
    }

    // Update the message request status
    messageRequest.status = MessageRequestStatus.REJECTED;
    return this.messageRequestRepository.save(messageRequest);
  }
}
