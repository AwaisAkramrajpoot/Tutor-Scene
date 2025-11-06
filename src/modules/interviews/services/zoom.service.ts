import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import {
  ZoomTokenResponse,
  ZoomMeetingResponse,
  CreateZoomMeetingRequest,
  ZoomMeetingSettings,
} from '../interfaces/zoom-meeting.interface';

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);
  private readonly ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';
  private readonly ZOOM_OAUTH_URL = 'https://zoom.us/oauth/token';
  
  private cachedToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor() {
    // Validate required environment variables
    if (!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
      this.logger.error('Missing required Zoom environment variables');
      throw new Error('Zoom credentials not configured');
    }
  }

  /**
   * Get OAuth access token using Server-to-Server OAuth flow
   * Implements token caching to prevent unnecessary API calls
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.cachedToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      this.logger.debug('Using cached Zoom access token');
      return this.cachedToken;
    }

    try {
      const accountId = process.env.ZOOM_ACCOUNT_ID;
      const clientId = process.env.ZOOM_CLIENT_ID;
      const clientSecret = process.env.ZOOM_CLIENT_SECRET;

      // Encode credentials as Base64
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      this.logger.debug('Requesting new Zoom access token');

      const response = await axios.post<ZoomTokenResponse>(
        this.ZOOM_OAUTH_URL,
        null,
        {
          params: {
            grant_type: 'account_credentials',
            account_id: accountId,
          },
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, expires_in } = response.data;

      // Cache token with 5-minute buffer before expiration
      this.cachedToken = access_token;
      this.tokenExpiresAt = Date.now() + (expires_in - 300) * 1000;

      this.logger.log('Successfully obtained Zoom access token');
      return access_token;

    } catch (error) {
      this.handleZoomError(error, 'Failed to authenticate with Zoom API');
    }
  }

  /**
   * Create a Zoom meeting
   * @param topic - Meeting topic/title
   * @param startTime - Meeting start time
   * @param duration - Meeting duration in minutes (default: 60)
   * @returns Zoom meeting details including URLs and password
   */
  async createMeeting(
    topic: string,
    startTime: Date,
    duration: number = 60,
  ): Promise<ZoomMeetingResponse> {
    try {
      const accessToken = await this.getAccessToken();

      // Configure meeting settings
      const settings: ZoomMeetingSettings = {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        audio: 'both',
        auto_recording: 'cloud',
      };

      const meetingData: CreateZoomMeetingRequest = {
        topic,
        type: 2, // Scheduled meeting
        start_time: startTime.toISOString(),
        duration,
        timezone: 'UTC',
        settings,
      };

      this.logger.debug(`Creating Zoom meeting: ${topic}`);

      const response = await axios.post<ZoomMeetingResponse>(
        `${this.ZOOM_API_BASE_URL}/users/me/meetings`,
        meetingData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Successfully created Zoom meeting: ${response.data.id}`);
      return response.data;

    } catch (error) {
      this.handleZoomError(error, 'Failed to create Zoom meeting');
    }
  }

  /**
   * Handle Zoom API errors with descriptive error messages
   */
  private handleZoomError(error: unknown, message: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      this.logger.error(`${message}:`, {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      // Provide more specific error messages based on status code
      if (axiosError.response?.status === 401) {
        throw new InternalServerErrorException(
          'Failed to authenticate with Zoom API. Please check Zoom credentials.'
        );
      } else if (axiosError.response?.status === 429) {
        throw new InternalServerErrorException(
          'Zoom API rate limit exceeded. Please try again later.'
        );
      } else if (axiosError.response?.status === 400) {
        throw new InternalServerErrorException(
          `Invalid Zoom meeting request: ${JSON.stringify(axiosError.response.data)}`
        );
      }
    } else {
      this.logger.error(`${message}:`, error);
    }

    throw new InternalServerErrorException(message);
  }

  /**
   * Clear cached token (useful for testing or forcing token refresh)
   */
  clearTokenCache(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = null;
    this.logger.debug('Zoom token cache cleared');
  }
}
