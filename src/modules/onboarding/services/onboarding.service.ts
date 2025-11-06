import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Prospect } from '@/database/entities/prospect.entity';
import { User } from '@/database/entities/user.entity';
import { AvailabilitySlot } from '@/database/entities/availability-slot.entity';
import { OnboardingDto } from '../dto/onboarding.dto';
import { FileType } from '../dto/file-upload.dto';
import { ProspectStatus, UserRole } from '@/database/entities/enums';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import Stripe from 'stripe';

@Injectable()
export class OnboardingService {
  private s3Client: S3Client;
  private bucketName: string;
  private stripe: Stripe;

  constructor(
    @InjectRepository(Prospect)
    private prospectRepository: Repository<Prospect>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AvailabilitySlot)
    private availabilityRepository: Repository<AvailabilitySlot>,
    private configService: ConfigService,
  ) {
    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET', 'tutor-scene-s3');

    // Initialize Stripe client
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Store file in S3 storage with validation
   * @param fileBuffer - The file buffer
   * @param fileName - The original file name
   * @param mimeType - The MIME type of the file
   * @param s3BucketUrl - The S3 bucket URL (not used, kept for backwards compatibility)
   * @returns S3 URL where the file is stored
   */
  async storeFileInS3(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    s3BucketUrl: string,
  ): Promise<string> {
    // Validate file type and size
    await this.validateFile(fileBuffer, fileName, mimeType);

    // Generate unique file name to avoid conflicts
    const uniqueFileName = this.generateUniqueFileName(fileName);

    // Determine folder based on file type
    let folder = this.configService.get<string>('AWS_S3_DOCUMENTS_FOLDER', 'Documents');
    const ext = path.extname(fileName).toLowerCase();

    if (mimeType.startsWith('video/') || ['.mp4', '.mov', '.avi'].includes(ext)) {
      folder = this.configService.get<string>('AWS_S3_RECORDINGS_FOLDER', 'Recordings');
    } else if (mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png'].includes(ext)) {
      folder = this.configService.get<string>('AWS_S3_PROFILE_PHOTOS_FOLDER', 'Profile_photos');
    }

    const key = `${folder}/${uniqueFileName}`;

    try {
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);

      // Generate presigned URL for secure access (valid for 7 days)
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn: 604800, // 7 days in seconds
      });

      return presignedUrl;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  /**
   * Update prospect with file URL
   * @param id - Prospect ID
   * @param fileUrl - S3 URL of the uploaded file
   * @param fileType - Type of file (cv, introVideo, govId)
   * @returns Updated prospect
   */
  async updateProspectWithFile(
    id: number,
    fileUrl: string,
    fileType: FileType,
  ): Promise<Prospect> {
    const prospect = await this.prospectRepository.findOne({ where: { id } });
    if (!prospect) {
      throw new NotFoundException(`Prospect with ID ${id} not found`);
    }

    // Update the appropriate field based on file type
    switch (fileType) {
      case FileType.CV:
        prospect.cv = fileUrl;
        break;
      case FileType.INTRO_VIDEO:
        prospect.introVideo = fileUrl;
        break;
      case FileType.GOV_ID:
        prospect.govId = fileUrl;
        break;
      default:
        throw new BadRequestException(`Unsupported file type: ${fileType}`);
    }

    try {
      return await this.prospectRepository.save(prospect);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update prospect with file URL');
    }
  }

  /**
   * Update prospect with file URL by user ID
   * @param userId - User ID from authenticated request
   * @param fileUrl - S3 URL of the uploaded file
   * @param fileType - Type of file (cv, introVideo, govId)
   * @returns Updated prospect
   */
  async updateProspectWithFileByUserId(
    userId: number,
    fileUrl: string,
    fileType: FileType,
  ): Promise<Prospect> {
    const prospect = await this.prospectRepository.findOne({ where: { userId } });
    if (!prospect) {
      throw new NotFoundException(`Prospect not found for user ID ${userId}. Please complete onboarding first.`);
    }

    // Update the appropriate field based on file type
    switch (fileType) {
      case FileType.CV:
        prospect.cv = fileUrl;
        break;
      case FileType.INTRO_VIDEO:
        prospect.introVideo = fileUrl;
        break;
      case FileType.GOV_ID:
        prospect.govId = fileUrl;
        break;
      default:
        throw new BadRequestException(`Unsupported file type: ${fileType}`);
    }

    try {
      return await this.prospectRepository.save(prospect);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update prospect with file URL');
    }
  }

  /**
   * Validate file based on type and size
   * @param fileBuffer - The file buffer
   * @param fileName - The original file name
   * @param mimeType - The MIME type of the file
   */
  private async validateFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<void> {
    const fileSize = fileBuffer.length;

    // Check file extension
    const ext = path.extname(fileName).toLowerCase();

    // Validate images (jpg, png, pdf)
    if (
      mimeType.startsWith('image/') ||
      ext === '.jpg' || ext === '.jpeg' ||
      ext === '.png' ||
      ext === '.pdf'
    ) {
      // Check size - max 2MB for images and documents
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (fileSize > maxSize) {
        throw new BadRequestException(
          `File size exceeds 2MB limit for images and documents`,
        );
      }
      return;
    }

    // Validate videos (mp4, mov, avi)
    if (
      mimeType.startsWith('video/') ||
      ext === '.mp4' ||
      ext === '.mov' ||
      ext === '.avi'
    ) {
      // For videos, we need to check both size and duration
      // Size validation - optimal size for 2 minutes of video is approximately 50MB
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (fileSize > maxSize) {
        throw new BadRequestException(
          `File size exceeds 50MB limit for videos`,
        );
      }

      // In a real implementation, you would also check video duration
      // This would require a library like ffmpeg to analyze the video
      /*
      const duration = await this.getVideoDuration(fileBuffer);
      if (duration > 120) { // 2 minutes in seconds
        throw new BadRequestException(
          `Video duration exceeds 2 minutes limit`,
        );
      }
      */

      return;
    }

    throw new BadRequestException(`Unsupported file type: ${mimeType}`);
  }

  /**
   * Generate unique file name to avoid conflicts
   * @param originalName - Original file name
   * @returns Unique file name
   */
  private generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    return `${name}-${timestamp}-${randomString}${ext}`;
  }

  /**
   * Process tutor onboarding
   * @param onboardingDto - Onboarding data
   * @returns Created prospect
   */
  async processTutorOnboarding(onboardingDto: OnboardingDto): Promise<Prospect> {
    try {
      const prospect = this.prospectRepository.create({
        ...onboardingDto,
        status: ProspectStatus.PENDING, // Set status as pending automatically
      });
      return await this.prospectRepository.save(prospect);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to save prospect information',
      );
    }
  }

  /**
   * Get prospect status by user ID
   * @param userId - User ID to search for
   * @returns Prospect status
   */
  async getProspectStatusByUserId(userId: number): Promise<{ status: string }> {
    const prospect = await this.prospectRepository.findOne({
      where: { userId },
      select: ['status']
    });

    if (!prospect) {
      throw new NotFoundException(`User not found in prospects`);
    }

    return { status: prospect.status };
  }

  /**
   * Get list of tutors/prospects with optional status filter
   * @param status - Optional status filter (defaults to 'active' if not provided)
   * @returns List of prospects
   */
  async getTutorsList(status?: string): Promise<Prospect[]> {
    try {
      // Default to 'active' if no status is provided
      const filterStatus = status || ProspectStatus.ACTIVE;

      // Validate status if provided
      if (status && !Object.values(ProspectStatus).includes(status as ProspectStatus)) {
        throw new BadRequestException(`Invalid status: ${status}. Valid values are: ${Object.values(ProspectStatus).join(', ')}`);
      }

      const prospects = await this.prospectRepository.find({
        where: { status: filterStatus as ProspectStatus },
        order: { createdAt: 'DESC' },
      });

      return prospects;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve tutors list');
    }
  }

  /**
   * Get tutor/prospect by ID
   * @param id - Prospect ID
   * @returns Prospect data
   */
  async getTutorById(id: number): Promise<Prospect> {
    const prospect = await this.prospectRepository.findOne({
      where: { id },
    });

    if (!prospect) {
      throw new NotFoundException(`Tutor with ID ${id} not found`);
    }

    return prospect;
  }

  /**
   * Search for active tutors with optional filters
   * @param subject - Subject filter (searches within subjects field)
   * @param priceRange - Price sorting: 'lowToHigh' or 'highToLow'
   * @param availability - Availability filter (day of week or specific date)
   * @param searchString - General search string for tutor name or other fields
   * @param level - Grade level filter (exact match)
   * @returns List of active tutors matching the criteria
   */
  async searchTutors(
    subject?: string,
    priceRange?: string,
    availability?: string,
    searchString?: string,
    level?: string,
  ): Promise<Prospect[]> {
    try {
      const queryBuilder = this.prospectRepository
        .createQueryBuilder('prospect')
        .where('prospect.status = :status', { status: ProspectStatus.ACTIVE });

      // Filter by subject if provided
      if (subject) {
        queryBuilder.andWhere('LOWER(prospect.subjects) LIKE LOWER(:subject)', {
          subject: `%${subject}%`,
        });
      }

      // Filter by grade level if provided (exact match)
      if (level) {
        queryBuilder.andWhere('LOWER(prospect.gradeLevels) LIKE LOWER(:level)', {
          level: `%${level}%`,
        });
      }

      // Filter by search string (searches in fullName and subjects)
      if (searchString) {
        queryBuilder.andWhere(
          '(LOWER(prospect.fullName) LIKE LOWER(:searchString) OR LOWER(prospect.subjects) LIKE LOWER(:searchString))',
          { searchString: `%${searchString}%` },
        );
      }

      // Filter by availability if provided (expects a date string YYYY-MM-DD)
      if (availability) {
        const searchDate = new Date(availability);
        
        // Set the start and end of the search day
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Build availability query - find tutors with slots on the specified date
        const availabilityQuery = this.availabilityRepository
          .createQueryBuilder('slot')
          .select('DISTINCT slot.tutorProfileId', 'tutorProfileId')
          .where('slot.startTime >= :startOfDay', { startOfDay })
          .andWhere('slot.startTime <= :endOfDay', { endOfDay });

        const availabilitySlots = await availabilityQuery.getRawMany();
        const tutorProfileIds = availabilitySlots.map((slot) => slot.tutorProfileId);

        if (tutorProfileIds.length > 0) {
          queryBuilder.andWhere('prospect.userId IN (:...tutorProfileIds)', {
            tutorProfileIds,
          });
        } else {
          // No tutors available for this criteria
          return [];
        }
      }

      // Apply price sorting
      if (priceRange === 'highToLow') {
        queryBuilder.orderBy('prospect.fee', 'DESC', 'NULLS LAST');
      } else {
        // Default to lowToHigh (ascending)
        queryBuilder.orderBy('prospect.fee', 'ASC', 'NULLS LAST');
      }

      // Secondary sort by creation date
      queryBuilder.addOrderBy('prospect.createdAt', 'DESC');

      const tutors = await queryBuilder.getMany();

      return tutors;
    } catch (error) {
      throw new InternalServerErrorException('Failed to search tutors');
    }
  }

  /**
   * Approve tutor and create Stripe accounts
   * @param id - Prospect ID
   * @returns Updated prospect with Stripe account details
   */
  async approveTutor(id: number): Promise<Prospect> {
    // Find the prospect with user relation
    const prospect = await this.prospectRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!prospect) {
      throw new NotFoundException(`Tutor with ID ${id} not found`);
    }

    // Check if already approved
    if (prospect.status === ProspectStatus.ACTIVE) {
      throw new BadRequestException('Tutor is already approved');
    }

    // Check if prospect has an associated user
    if (!prospect.userId) {
      throw new BadRequestException('Prospect does not have an associated user account');
    }

    try {
      // Create Stripe Customer
      const customer = await this.stripe.customers.create({
        name: prospect.fullName,
        email: prospect.user?.email || `tutor${id}@tutorscene.com`,
        metadata: {
          prospectId: id.toString(),
          tutorName: prospect.fullName,
        },
      });

      // Create Stripe Connect Account for receiving payments
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: prospect.user?.email || `tutor${id}@tutorscene.com`,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          prospectId: id.toString(),
          tutorName: prospect.fullName,
        },
      });

      // Update prospect with Stripe IDs and set status to active
      prospect.customerId = customer.id;
      prospect.paymentAccountId = account.id;
      prospect.status = ProspectStatus.ACTIVE;
      prospect.setupComplete = true;

      // Update the associated user's role to TUTOR
      if (prospect.user) {
        prospect.user.role = UserRole.TUTOR;
        await this.userRepository.save(prospect.user);
      }

      const updatedProspect = await this.prospectRepository.save(prospect);

      return updatedProspect;
    } catch (error) {
      console.error('Stripe account creation error:', error);
      throw new InternalServerErrorException(
        `Failed to create Stripe accounts: ${error.message}`,
      );
    }
  }

  /**
   * Generate Stripe Connect onboarding link for tutor
   * @param userId - User ID
   * @returns Stripe onboarding URL
   */
  async generateStripeOnboardingLink(userId: number): Promise<string> {
    // Find prospect by user ID
    const prospect = await this.prospectRepository.findOne({
      where: { userId },
    });

    if (!prospect) {
      throw new NotFoundException(`Prospect not found for user ID ${userId}`);
    }

    if (!prospect.paymentAccountId) {
      throw new BadRequestException('Prospect does not have a Stripe Connect account. Please contact admin.');
    }

    try {
      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: prospect.paymentAccountId,
        refresh_url: `${this.configService.get('FRONTEND_URL')}/tutor/onboarding/refresh`,
        return_url: `${this.configService.get('FRONTEND_URL')}/tutor/onboarding/complete`,
        type: 'account_onboarding',
      });

      return accountLink.url;
    } catch (error) {
      console.error('Stripe account link creation error:', error);
      throw new InternalServerErrorException(
        `Failed to generate onboarding link: ${error.message}`,
      );
    }
  }

  /**
   * Get payment onboarding status for tutor
   * @param userId - User ID
   * @returns Payment onboarding status
   */
  async getPaymentOnboardingStatus(userId: number): Promise<{ paymentOnBoarded: boolean }> {
    const prospect = await this.prospectRepository.findOne({
      where: { userId },
      select: ['paymentOnBoarded'],
    });

    if (!prospect) {
      throw new NotFoundException(`Prospect not found for user ID ${userId}`);
    }

    return { paymentOnBoarded: prospect.paymentOnBoarded };
  }
}
