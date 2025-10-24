import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { VideoSession } from '@/database/entities/video-session.entity';
import { CreateVideoSessionDto } from './dto/create-video-session.dto';

@Injectable()
export class VideoSessionsService {
  constructor(
    @InjectRepository(VideoSession)
    private readonly videoSessionRepository: Repository<VideoSession>,
    private readonly configService: ConfigService,
  ) {}

  async create(createDto: CreateVideoSessionDto): Promise<VideoSession> {
    const zoomApiKey = this.configService.get<string>('ZOOM_API_KEY');
    const zoomApiSecret = this.configService.get<string>('ZOOM_API_SECRET');

    // Create Zoom meeting
    const zoomResponse = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: `Tutoring Session - Booking #${createDto.bookingId}`,
        type: 2, // Scheduled meeting
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          auto_recording: createDto.recordingConsent ? 'cloud' : 'none',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${zoomApiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const { id, join_url, start_url, password } = zoomResponse.data;

    const session = this.videoSessionRepository.create({
      bookingId: createDto.bookingId,
      zoomMeetingId: id.toString(),
      joinUrl: join_url,
      startUrl: start_url,
      meetingPassword: password,
      recordingConsent: createDto.recordingConsent || false,
    });

    return this.videoSessionRepository.save(session);
  }

  async findByBooking(bookingId: number): Promise<VideoSession> {
    const session = await this.videoSessionRepository.findOne({
      where: { bookingId },
    });
    if (!session) {
      throw new NotFoundException(`Video session for booking ${bookingId} not found`);
    }
    return session;
  }

  async findOne(id: number): Promise<VideoSession> {
    const session = await this.videoSessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Video session with ID ${id} not found`);
    }
    return session;
  }

  async endSession(id: number): Promise<VideoSession> {
    const session = await this.findOne(id);
    session.endedAt = new Date();
    if (session.startedAt) {
      const duration = Math.floor(
        (session.endedAt.getTime() - session.startedAt.getTime()) / (1000 * 60),
      );
      session.durationMinutes = duration;
    }
    return this.videoSessionRepository.save(session);
  }
}
