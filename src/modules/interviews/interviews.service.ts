import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from '@/database/entities/interview.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { User } from '@/database/entities/user.entity';
import { ProspectStatus, InterviewStatus } from '@/database/entities/enums';
import { ZoomService } from './services/zoom.service';
import { MailService } from '../auth/services/mail.service';
import { InterviewResponseDto } from './dto/interview-response.dto';

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
    private readonly zoomService: ZoomService,
    private readonly mailService: MailService,
  ) { }

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
}
