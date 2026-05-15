import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from '@/database/entities/interview.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { User } from '@/database/entities/user.entity';
import { VirtualInterviewResponse } from '@/database/entities/virtual-interview-response.entity';
import { InterviewTopic } from '@/database/entities/interview-topic.entity';
import { InterviewQuestion } from '@/database/entities/interview-question.entity';
import { ProspectStatus, InterviewStatus } from '@/database/entities/enums';
import { ZoomService } from './services/zoom.service';
import { MailService } from '../auth/services/mail.service';
import { InterviewResponseDto } from './dto/interview-response.dto';
import { CreateInterviewTopicDto } from './dto/create-interview-topic.dto';
import { UpdateInterviewTopicDto } from './dto/update-interview-topic.dto';
import { CreateInterviewQuestionDto } from './dto/create-interview-question.dto';
import { UpdateInterviewQuestionDto } from './dto/update-interview-question.dto';

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepository: Repository<Interview>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(VirtualInterviewResponse)
    private readonly virtualInterviewRepository: Repository<VirtualInterviewResponse>,
    @InjectRepository(InterviewTopic)
    private readonly interviewTopicRepository: Repository<InterviewTopic>,
    @InjectRepository(InterviewQuestion)
    private readonly interviewQuestionRepository: Repository<InterviewQuestion>,
    private readonly zoomService: ZoomService,
    private readonly mailService: MailService,
  ) {}

  async scheduleInterview(
    userId: number,
    startTime: Date,
  ): Promise<InterviewResponseDto> {
    try {
      // Validate prospect
      const prospect = await this.validateProspectForInterview(userId);

      // Create Zoom meeting
      const topic = `Interview with ${prospect.fullName}`;
      const duration = 60; // Default 60 minutes
      const zoomMeeting = await this.zoomService.createMeeting(
        topic,
        startTime,
        duration,
      );

      // Save interview record
      const interview = this.interviewRepository.create({
        userId,
        startTime,
        zoomMeetingId: zoomMeeting.id,
        hostStartUrl: zoomMeeting.start_url,
        participantJoinUrl: zoomMeeting.join_url,
        meetingPassword: zoomMeeting.password,
        status: InterviewStatus.SCHEDULED,
      });

      const savedInterview = await this.interviewRepository.save(interview);

      // Update prospect status to awaiting_interview
      prospect.status = ProspectStatus.AWAITING_INTERVIEW;
      await this.prospectRepository.save(prospect);

      // Send email notification to tutor
      try {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user && user.email) {
          await this.mailService.sendInterviewScheduledEmail(
            user.email,
            prospect.fullName,
            startTime,
            zoomMeeting.join_url,
          );
        }
      } catch (emailError) {
        // Log error but don't fail the interview scheduling
        this.logger.error('Failed to send interview scheduled email', {
          error: emailError.message,
          userId,
        });
      }

      return this.mapToResponseDto(savedInterview);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error('Unexpected error in interview scheduling', {
        error: error.message,
        stack: error.stack,
        userId,
      });

      throw new InternalServerErrorException('Failed to schedule interview');
    }
  }

  async getAllInterviews(
    status?: InterviewStatus,
  ): Promise<InterviewResponseDto[]> {
    const whereCondition = status ? { status } : {};

    const interviews = await this.interviewRepository.find({
      where: whereCondition,
      order: { startTime: 'ASC' },
    });

    return interviews.map((interview) => this.mapToResponseDto(interview));
  }

  async getInterviewByUserId(userId: number): Promise<InterviewResponseDto> {
    const interview = await this.interviewRepository.findOne({
      where: { userId },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    return this.mapToResponseDto(interview);
  }

  async getMyInterview(userId: number): Promise<InterviewResponseDto | null> {
    const interview = await this.interviewRepository.findOne({
      where: { userId },
    });

    if (!interview) {
      return null;
    }

    return this.mapToResponseDto(interview);
  }

  async getInterviewById(id: number): Promise<Interview> {
    const interview = await this.interviewRepository.findOne({
      where: { id },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    return interview;
  }

  async getHostStartUrl(interviewId: number): Promise<{ hostStartUrl: string }> {
    const interview = await this.getInterviewById(interviewId);

    if (interview.status !== InterviewStatus.SCHEDULED) {
      throw new BadRequestException(
        'Cannot access meeting URLs for cancelled/completed interviews',
      );
    }

    return { hostStartUrl: interview.hostStartUrl };
  }

  async getParticipantJoinUrl(
    interviewId: number,
  ): Promise<{ participantJoinUrl: string }> {
    const interview = await this.getInterviewById(interviewId);

    if (interview.status !== InterviewStatus.SCHEDULED) {
      throw new BadRequestException(
        'Cannot access meeting URLs for cancelled/completed interviews',
      );
    }

    return { participantJoinUrl: interview.participantJoinUrl };
  }

  async updateInterviewStatus(
    id: number,
    status: InterviewStatus,
  ): Promise<InterviewResponseDto> {
    const interview = await this.getInterviewById(id);

    // Validate status transitions
    if (interview.status !== InterviewStatus.SCHEDULED) {
      throw new BadRequestException('Invalid status transition');
    }

    if (
      status !== InterviewStatus.COMPLETED &&
      status !== InterviewStatus.CANCELLED
    ) {
      throw new BadRequestException('Invalid status transition');
    }

    interview.status = status;
    const updatedInterview = await this.interviewRepository.save(interview);

    return this.mapToResponseDto(updatedInterview);
  }

  private async validateProspectForInterview(userId: number): Promise<Prospect> {
    const prospect = await this.prospectRepository.findOne({
      where: { userId, status: ProspectStatus.PENDING },
    });

    if (!prospect) {
      throw new NotFoundException('Pending prospect not found for this user');
    }

    // Check for existing scheduled interview
    const existingInterview = await this.interviewRepository.findOne({
      where: { userId, status: InterviewStatus.SCHEDULED },
    });

    if (existingInterview) {
      throw new BadRequestException(
        'Interview already scheduled for this prospect',
      );
    }

    return prospect;
  }

  private mapToResponseDto(interview: Interview): InterviewResponseDto {
    return {
      id: interview.id,
      userId: interview.userId,
      startTime: interview.startTime,
      zoomMeetingId: interview.zoomMeetingId,
      hostStartUrl: interview.hostStartUrl,
      participantJoinUrl: interview.participantJoinUrl,
      meetingPassword: interview.meetingPassword,
      status: interview.status,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    };
  }

  async getVirtualInterviewByUserId(userId: number): Promise<VirtualInterviewResponse> {
    const existing = await this.virtualInterviewRepository.findOne({ where: { userId } });
    if (existing) return existing;

    const created = this.virtualInterviewRepository.create({
      userId,
      responses: {},
      completed: false,
      submittedAt: null,
    });
    return this.virtualInterviewRepository.save(created);
  }

  async saveVirtualInterview(
    userId: number,
    responses: Record<string, unknown>,
    completed: boolean,
  ): Promise<VirtualInterviewResponse> {
    const existing = await this.getVirtualInterviewByUserId(userId);
    existing.responses = (responses || {}) as VirtualInterviewResponse['responses'];
    existing.completed = !!completed;
    existing.submittedAt = completed ? new Date() : null;
    return this.virtualInterviewRepository.save(existing);
  }

  private mapTopicForTutor(t: InterviewTopic) {
    const questions = (t.questions || [])
      .filter((q) => q.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((q) => ({
        id: q.id,
        optionKey: q.optionKey,
        body: q.body,
        sortOrder: q.sortOrder,
      }));
    return {
      id: t.id,
      slug: t.slug,
      title: t.title,
      sortOrder: t.sortOrder,
      questions,
    };
  }

  async getVirtualQuestionnaireForTutor() {
    const topics = await this.interviewTopicRepository.find({
      where: { isActive: true },
      relations: ['questions'],
      order: { sortOrder: 'ASC' },
    });
    return { topics: topics.map((t) => this.mapTopicForTutor(t)) };
  }

  async getVirtualQuestionnaireAdmin() {
    const topics = await this.interviewTopicRepository.find({
      relations: ['questions'],
      order: { sortOrder: 'ASC' },
    });
    return topics.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      sortOrder: t.sortOrder,
      isActive: t.isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      questions: (t.questions || [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((q) => ({
          id: q.id,
          topicId: q.topicId,
          optionKey: q.optionKey,
          body: q.body,
          sortOrder: q.sortOrder,
          isActive: q.isActive,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        })),
    }));
  }

  async createInterviewTopic(dto: CreateInterviewTopicDto) {
    const slug = dto.slug.trim();
    const dup = await this.interviewTopicRepository.findOne({ where: { slug } });
    if (dup) {
      throw new ConflictException('Topic slug already exists');
    }
    const row = this.interviewTopicRepository.create({
      slug,
      title: dto.title.trim(),
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.interviewTopicRepository.save(row);
  }

  async updateInterviewTopic(id: number, dto: UpdateInterviewTopicDto) {
    const row = await this.interviewTopicRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Topic not found');
    if (dto.slug !== undefined && dto.slug.trim() !== row.slug) {
      const dup = await this.interviewTopicRepository.findOne({ where: { slug: dto.slug.trim() } });
      if (dup) throw new ConflictException('Topic slug already exists');
      row.slug = dto.slug.trim();
    }
    if (dto.title !== undefined) row.title = dto.title.trim();
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    return this.interviewTopicRepository.save(row);
  }

  async deleteInterviewTopic(id: number) {
    const row = await this.interviewTopicRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Topic not found');
    await this.interviewTopicRepository.remove(row);
    return { deleted: true };
  }

  async createInterviewQuestion(topicId: number, dto: CreateInterviewQuestionDto) {
    const topic = await this.interviewTopicRepository.findOne({ where: { id: topicId } });
    if (!topic) throw new NotFoundException('Topic not found');
    const key = dto.optionKey.trim();
    const dup = await this.interviewQuestionRepository.findOne({
      where: { topicId, optionKey: key },
    });
    if (dup) throw new ConflictException('Option key already exists for this topic');
    const row = this.interviewQuestionRepository.create({
      topicId,
      optionKey: key,
      body: dto.body.trim(),
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.interviewQuestionRepository.save(row);
  }

  async updateInterviewQuestion(id: number, dto: UpdateInterviewQuestionDto) {
    const row = await this.interviewQuestionRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Question not found');
    if (dto.optionKey !== undefined) {
      const key = dto.optionKey.trim();
      const dup = await this.interviewQuestionRepository.findOne({
        where: { topicId: row.topicId, optionKey: key },
      });
      if (dup && dup.id !== row.id) throw new ConflictException('Option key already exists for this topic');
      row.optionKey = key;
    }
    if (dto.body !== undefined) row.body = dto.body.trim();
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    return this.interviewQuestionRepository.save(row);
  }

  async deleteInterviewQuestion(id: number) {
    const row = await this.interviewQuestionRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Question not found');
    await this.interviewQuestionRepository.remove(row);
    return { deleted: true };
  }
}
