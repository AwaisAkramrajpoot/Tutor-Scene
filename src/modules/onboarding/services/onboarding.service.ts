import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, IsNull } from 'typeorm';
import { Prospect } from '@/database/entities/prospect.entity';
import { User } from '@/database/entities/user.entity';
import { AvailabilitySlot } from '@/database/entities/availability-slot.entity';
import { Conversation } from '@/database/entities/conversation.entity';
import { Message } from '@/database/entities/message.entity';
import {
  buildSubjectPillsFromProspect,
  computeFeeRangeFromBaseFee,
} from '../tutor-learner-meta.util';
import { OnboardingDto } from '../dto/onboarding.dto';
import { FileType } from '../dto/file-upload.dto';
import { ProspectStatus, UserRole } from '@/database/entities/enums';
import * as path from 'path';
import * as fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import Stripe from 'stripe';

@Injectable()
export class OnboardingService {
  private s3Client: S3Client;
  private bucketName: string;
  private stripe: Stripe;
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'onboarding');

  constructor(
    @InjectRepository(Prospect)
    private prospectRepository: Repository<Prospect>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AvailabilitySlot)
    private availabilityRepository: Repository<AvailabilitySlot>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
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

    if (this.configService.get<string>('USE_LOCAL_FILE_STORAGE') === 'true') {
      return this.storeFileLocally(fileBuffer, uniqueFileName);
    }

    // Determine folder based on file type
    let folder = this.configService.get<string>('AWS_S3_DOCUMENTS_FOLDER', 'Documents');
    const ext = path.extname(fileName).toLowerCase();

    if (mimeType.startsWith('video/') || ['.mp4', '.mov', '.avi'].includes(ext)) {
      folder = this.configService.get<string>('AWS_S3_RECORDINGS_FOLDER', 'Recordings');
    } else if (mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png'].includes(ext)) {
      folder = this.configService.get<string>('AWS_S3_PROFILE_PHOTOS_FOLDER', 'Profile_photos');
    }

    const key = `${folder}/${uniqueFileName}`;
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const shouldUseLocalFallback =
      !accessKeyId ||
      !secretAccessKey ||
      accessKeyId.includes('your_aws_access_key_id') ||
      secretAccessKey.includes('your_aws_secret_access_key');

    try {
      if (shouldUseLocalFallback) {
        return this.storeFileLocally(fileBuffer, uniqueFileName);
      }
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
      // Dev-safe fallback: if S3 fails, persist file locally.
      return this.storeFileLocally(fileBuffer, uniqueFileName);
    }
  }

  private storeFileLocally(fileBuffer: Buffer, fileName: string): string {
    const fullDir = this.uploadsDir;
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
    const diskPath = path.join(fullDir, fileName);
    fs.writeFileSync(diskPath, fileBuffer);
    return `/uploads/onboarding/${fileName}`;
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
    const normalizedUserId = this.normalizeUserId(userId);
    const published = await this.findPublishedProspectByUserId(normalizedUserId);
    if (!published) {
      throw new NotFoundException(`Prospect not found for user ID ${normalizedUserId}. Please complete onboarding first.`);
    }

    const prospect =
      published.status === ProspectStatus.ACTIVE
        ? await this.ensureProfileDraft(published, normalizedUserId)
        : published;

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

  private normalizeUserId(userId: number | string): number {
    const n = Number(userId);
    if (!Number.isFinite(n) || n <= 0) {
      throw new BadRequestException('Invalid userId');
    }
    return Math.trunc(n);
  }

  private prospectStatusRank(status: ProspectStatus): number {
    switch (status) {
      case ProspectStatus.ACTIVE:
        return 0;
      case ProspectStatus.AWAITING_INTERVIEW:
        return 1;
      case ProspectStatus.SUSPENDED:
        return 2;
      default:
        return 3;
    }
  }

  private pickCanonicalProspect(prospects: Prospect[]): Prospect | null {
    if (!prospects.length) {
      return null;
    }
    return [...prospects].sort((a, b) => {
      const byStatus =
        this.prospectStatusRank(a.status) - this.prospectStatusRank(b.status);
      if (byStatus !== 0) {
        return byStatus;
      }
      return (
        (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)
      );
    })[0];
  }

  private applyOnboardingDtoToProspect(
    prospect: Prospect,
    onboardingDto: OnboardingDto,
  ): void {
    prospect.fullName = onboardingDto.fullName;
    prospect.dateOfBirth = onboardingDto.dateOfBirth;
    prospect.subjects = onboardingDto.subjects;
    prospect.gradeLevels = onboardingDto.gradeLevels;
    prospect.yearsOfExperience = onboardingDto.yearsOfExperience;
    prospect.teachingPhilosophy = onboardingDto.teachingPhilosophy;
    if (onboardingDto.cv !== undefined) {
      prospect.cv = onboardingDto.cv;
    }
    if (onboardingDto.introVideo !== undefined) {
      prospect.introVideo = onboardingDto.introVideo;
    }
    if (onboardingDto.govId !== undefined) {
      prospect.govId = onboardingDto.govId;
    }
    if (onboardingDto.profilePic !== undefined) {
      prospect.profilePic = onboardingDto.profilePic;
    }
    if (onboardingDto.fee !== undefined) {
      prospect.fee = onboardingDto.fee;
    }
    if (onboardingDto.interviewTime !== undefined) {
      prospect.interviewTime = onboardingDto.interviewTime;
    }
  }

  private mergeDraftProfileIntoPublished(
    published: Prospect,
    draft: Prospect,
  ): void {
    published.fullName = draft.fullName;
    published.dateOfBirth = draft.dateOfBirth;
    published.subjects = draft.subjects;
    published.gradeLevels = draft.gradeLevels;
    published.yearsOfExperience = draft.yearsOfExperience;
    published.teachingPhilosophy = draft.teachingPhilosophy;
    published.cv = draft.cv;
    published.introVideo = draft.introVideo;
    published.govId = draft.govId;
    published.profilePic = draft.profilePic;
    published.fee = draft.fee;
    published.interviewTime = draft.interviewTime;
  }

  private isPublishedLive(prospect: Prospect): boolean {
    if (prospect.parentProspectId) {
      return false;
    }
    if (prospect.status === ProspectStatus.ACTIVE) {
      return true;
    }
    return Boolean(
      prospect.paymentAccountId &&
        prospect.status === ProspectStatus.PENDING,
    );
  }

  private async healPublishedProspect(prospect: Prospect): Promise<Prospect> {
    if (
      !prospect.parentProspectId &&
      prospect.paymentAccountId &&
      prospect.status !== ProspectStatus.ACTIVE
    ) {
      prospect.status = ProspectStatus.ACTIVE;
      return this.prospectRepository.save(prospect);
    }
    return prospect;
  }

  private async findPublishedProspectByUserId(
    userId: number,
  ): Promise<Prospect | null> {
    const all = await this.prospectRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
    if (!all.length) {
      return null;
    }

    const roots = all.filter((p) => !p.parentProspectId);
    const liveRoots = roots.filter((p) => this.isPublishedLive(p));
    if (liveRoots.length) {
      const best = this.pickCanonicalProspect(liveRoots) ?? liveRoots[0];
      return this.healPublishedProspect(best);
    }

    return this.pickCanonicalProspect(roots);
  }

  private async reconcileOrphanPendingRootsForUser(
    userId: number,
  ): Promise<void> {
    const published = await this.findPublishedProspectByUserId(userId);
    if (!published || published.status !== ProspectStatus.ACTIVE) {
      return;
    }

    const orphanPendingRoots = await this.prospectRepository.find({
      where: {
        userId,
        parentProspectId: IsNull(),
        status: ProspectStatus.PENDING,
      },
      order: { updatedAt: 'DESC' },
    });
    const orphans = orphanPendingRoots.filter((p) => p.id !== published.id);
    if (!orphans.length) {
      return;
    }

    let draft = await this.findDraftForPublished(published.id);
    if (!draft) {
      const [primary, ...extras] = orphans;
      primary.parentProspectId = published.id;
      await this.prospectRepository.save(primary);
      draft = primary;
      for (const extra of extras) {
        await this.prospectRepository.remove(extra);
      }
      return;
    }

    for (const orphan of orphans) {
      await this.prospectRepository.remove(orphan);
    }
  }

  private async findDraftForPublished(
    publishedId: number,
  ): Promise<Prospect | null> {
    return this.prospectRepository.findOne({
      where: {
        parentProspectId: publishedId,
        status: ProspectStatus.PENDING,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  private async findCanonicalProspectByUserId(
    userId: number,
  ): Promise<Prospect | null> {
    return this.findPublishedProspectByUserId(userId);
  }

  private async ensureProfileDraft(
    published: Prospect,
    userId: number,
  ): Promise<Prospect> {
    const existing = await this.findDraftForPublished(published.id);
    if (existing) {
      return existing;
    }
    const onboardingDto = {
      userId,
      fullName: published.fullName,
      dateOfBirth: published.dateOfBirth,
      subjects: published.subjects,
      gradeLevels: published.gradeLevels,
      yearsOfExperience: published.yearsOfExperience,
      teachingPhilosophy: published.teachingPhilosophy,
      cv: published.cv,
      introVideo: published.introVideo,
      govId: published.govId,
      profilePic: published.profilePic,
      fee: published.fee,
    } as OnboardingDto;
    return this.createProfileDraft(published, onboardingDto, userId);
  }

  private async createProfileDraft(
    published: Prospect,
    onboardingDto: OnboardingDto,
    userId: number,
  ): Promise<Prospect> {
    const prospectId = await this.generateProspectId();
    const draft = this.prospectRepository.create({
      prospectId,
      parentProspectId: published.id,
      userId,
      status: ProspectStatus.PENDING,
      fullName: onboardingDto.fullName,
      dateOfBirth: onboardingDto.dateOfBirth,
      subjects: onboardingDto.subjects,
      gradeLevels: onboardingDto.gradeLevels || published.gradeLevels || '',
      yearsOfExperience: onboardingDto.yearsOfExperience,
      teachingPhilosophy: onboardingDto.teachingPhilosophy,
      cv: onboardingDto.cv ?? published.cv,
      introVideo: onboardingDto.introVideo ?? published.introVideo,
      govId: onboardingDto.govId ?? published.govId,
      profilePic: onboardingDto.profilePic ?? published.profilePic,
      fee: onboardingDto.fee ?? published.fee,
      setupComplete: false,
      paymentOnBoarded: false,
    });
    return this.prospectRepository.save(draft);
  }

  /**
   * Process tutor onboarding
   * @param onboardingDto - Onboarding data
   * @returns Created prospect
   */
  async processTutorOnboarding(onboardingDto: OnboardingDto): Promise<Prospect> {
    try {
      const userId = this.normalizeUserId(onboardingDto.userId);
      onboardingDto.userId = userId;

      await this.reconcileOrphanPendingRootsForUser(userId);
      const published = await this.findPublishedProspectByUserId(userId);

      let saved: Prospect;
      if (!published) {
        const prospectId = await this.generateProspectId();
        const prospect = this.prospectRepository.create({
          prospectId,
          ...onboardingDto,
          status: ProspectStatus.PENDING,
          parentProspectId: null,
        });
        saved = await this.prospectRepository.save(prospect);
      } else if (this.isPublishedLive(published)) {
        if (published.status !== ProspectStatus.ACTIVE) {
          published.status = ProspectStatus.ACTIVE;
          await this.prospectRepository.save(published);
        }
        let draft = await this.findDraftForPublished(published.id);
        if (!draft) {
          saved = await this.createProfileDraft(
            published,
            onboardingDto,
            userId,
          );
        } else {
          this.applyOnboardingDtoToProspect(draft, onboardingDto);
          draft.status = ProspectStatus.PENDING;
          draft.userId = userId;
          draft.parentProspectId = published.id;
          saved = await this.prospectRepository.save(draft);
        }
      } else {
        const preservedStatus = published.status;
        this.applyOnboardingDtoToProspect(published, onboardingDto);
        published.status = preservedStatus;
        published.userId = userId;
        saved = await this.prospectRepository.save(published);
      }

      const user = await this.userRepository.findOne({
        where: { id: onboardingDto.userId },
      });
      if (user) {
        const trimmed = String(onboardingDto.fullName || '').trim();
        const parts = trimmed.split(/\s+/).filter(Boolean);
        if (parts.length > 0) {
          user.firstName = parts[0];
          user.lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
          await this.userRepository.save(user);
        }
      }

      return saved;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to save prospect information',
      );
    }
  }

  async getPublishedProspectByUserId(userId: number): Promise<Prospect | null> {
    return this.findPublishedProspectByUserId(this.normalizeUserId(userId));
  }

  async getProspectByUserId(userId: number): Promise<Prospect | null> {
    const normalizedUserId = this.normalizeUserId(userId);
    const published = await this.findPublishedProspectByUserId(normalizedUserId);
    if (!published) {
      return null;
    }
    const draft = await this.findDraftForPublished(published.id);
    return draft ?? published;
  }

  private async generateProspectId(): Promise<string> {
    // Get the latest prospect to determine the next number
    const latestProspect = await this.prospectRepository
      .createQueryBuilder('prospect')
      .orderBy('prospect.createdAt', 'DESC')
      .limit(1)
      .getOne();

    let nextNumber = 1;
    
    if (latestProspect && latestProspect.prospectId) {
      // Parse the numeric ID
      const currentNumber = parseInt(latestProspect.prospectId, 10);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }

    // Format as 00001, 00002, etc. (5 digits)
    return nextNumber.toString().padStart(5, '0');
  }

  /**
   * Get prospect status by user ID
   * @param userId - User ID to search for
   * @returns Prospect status
   */
  async getProspectStatusByUserId(userId: number): Promise<{
    status: string;
    publishedStatus?: string;
    hasPendingProfileUpdate?: boolean;
  }> {
    const published = await this.findPublishedProspectByUserId(
      this.normalizeUserId(userId),
    );

    if (!published) {
      return { status: 'not_started' };
    }

    const draft = await this.findDraftForPublished(published.id);
    if (draft && published.status === ProspectStatus.ACTIVE) {
      return {
        status: ProspectStatus.PENDING,
        publishedStatus: published.status,
        hasPendingProfileUpdate: true,
      };
    }

    return { status: published.status };
  }

  /**
   * Get list of tutors/prospects with optional status filter
   * @param status - Optional status filter (defaults to 'active' if not provided, use 'all' to get all records)
   * @returns List of prospects
   */
  async getTutorsList(status?: string): Promise<Prospect[]> {
    try {
      const filterStatus =
        status?.toLowerCase() === 'all' ? null : status || ProspectStatus.ACTIVE;

      if (
        filterStatus &&
        !Object.values(ProspectStatus).includes(filterStatus as ProspectStatus)
      ) {
        throw new BadRequestException(`Invalid status: ${status}. Valid values are: ${Object.values(ProspectStatus).join(', ')}, all`);
      }

      const allProspects = await this.prospectRepository.find({
        order: { createdAt: 'DESC' },
      });
      const roots = allProspects.filter((p) => !p.parentProspectId);
      const draftsByParent = new Map<number, Prospect>();
      for (const prospect of allProspects) {
        if (prospect.parentProspectId) {
          draftsByParent.set(prospect.parentProspectId, prospect);
        }
      }

      const adminRows = roots.map((root) => draftsByParent.get(root.id) ?? root);

      if (!filterStatus) {
        return adminRows;
      }

      if (filterStatus === ProspectStatus.ACTIVE) {
        return roots.filter(
          (root) =>
            root.status === ProspectStatus.ACTIVE &&
            !draftsByParent.has(root.id),
        );
      }

      return adminRows.filter((row) => row.status === filterStatus);
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
  async getTutorById(id: number, forAdmin = false): Promise<Prospect> {
    const prospect = await this.prospectRepository.findOne({
      where: { id },
    });

    if (!prospect) {
      throw new NotFoundException(`Tutor with ID ${id} not found`);
    }

    if (!forAdmin && prospect.parentProspectId) {
      return this.getTutorById(prospect.parentProspectId, false);
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
    minFee?: string,
    maxFee?: string,
  ): Promise<Prospect[]> {
    try {
      const queryBuilder = this.prospectRepository
        .createQueryBuilder('prospect')
        .where('prospect.parentProspectId IS NULL')
        .andWhere(
          new Brackets((qb) => {
            qb.where('prospect.status = :active', {
              active: ProspectStatus.ACTIVE,
            }).orWhere(
              '(prospect.payment_account_id IS NOT NULL AND prospect.setup_complete = true)',
            );
          }),
        );

      if (subject && String(subject).trim()) {
        const trimmed = String(subject).trim();
        const baseName = trimmed.replace(/\s*\([^)]*\)\s*$/, '').trim();
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('LOWER(prospect.subjects) LIKE LOWER(:subjectFull)', {
              subjectFull: `%${trimmed}%`,
            });
            if (baseName && baseName.toLowerCase() !== trimmed.toLowerCase()) {
              qb.orWhere('LOWER(prospect.subjects) LIKE LOWER(:subjectBase)', {
                subjectBase: `%${baseName}%`,
              });
            }
          }),
        );
      }

      if (level && String(level).trim()) {
        const lev = String(level).trim();
        const firstTok = lev.split(/\s+/)[0] || lev;
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where("TRIM(COALESCE(prospect.gradeLevels, '')) = ''").orWhere(
              new Brackets((qb2) => {
                qb2
                  .where('LOWER(prospect.gradeLevels) LIKE LOWER(:lvFull)', {
                    lvFull: `%${lev}%`,
                  })
                  .orWhere('LOWER(prospect.gradeLevels) LIKE LOWER(:lvFirst)', {
                    lvFirst: `%${firstTok}%`,
                  });
              }),
            );
          }),
        );
      }

      if (minFee !== undefined && minFee !== null && minFee !== '') {
        const n = Number(minFee);
        if (!Number.isNaN(n)) {
          queryBuilder.andWhere(
            new Brackets((qb) => {
              qb.where('prospect.fee IS NULL').orWhere('prospect.fee >= :minFee', {
                minFee: n,
              });
            }),
          );
        }
      }
      if (maxFee !== undefined && maxFee !== null && maxFee !== '') {
        const n = Number(maxFee);
        if (!Number.isNaN(n)) {
          queryBuilder.andWhere(
            new Brackets((qb) => {
              qb.where('prospect.fee IS NULL').orWhere('prospect.fee <= :maxFee', {
                maxFee: n,
              });
            }),
          );
        }
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

      queryBuilder.take(150);

      const tutors = await queryBuilder.getMany();

      const healed: Prospect[] = [];
      for (const tutor of tutors) {
        healed.push(await this.healPublishedProspect(tutor));
      }

      const byUser = new Map<number, Prospect>();
      const withoutUser: Prospect[] = [];
      for (const tutor of healed) {
        if (tutor.userId == null) {
          withoutUser.push(tutor);
          continue;
        }
        if (!byUser.has(tutor.userId)) {
          byUser.set(tutor.userId, tutor);
        }
      }

      return [...withoutUser, ...byUser.values()];
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

    if (!prospect.userId) {
      throw new BadRequestException('Prospect does not have an associated user account');
    }

    if (prospect.parentProspectId) {
      const published = await this.prospectRepository.findOne({
        where: { id: prospect.parentProspectId },
        relations: ['user'],
      });
      if (!published) {
        throw new NotFoundException('Published tutor profile not found for this update');
      }
      if (prospect.status !== ProspectStatus.PENDING) {
        throw new BadRequestException('Only pending profile updates can be approved');
      }
      this.mergeDraftProfileIntoPublished(published, prospect);
      await this.prospectRepository.remove(prospect);
      return this.prospectRepository.save(published);
    }

    if (prospect.status === ProspectStatus.ACTIVE) {
      throw new BadRequestException('Tutor is already approved');
    }

    try {
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
    const prospect = await this.findCanonicalProspectByUserId(
      this.normalizeUserId(userId),
    );

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
   * Stripe Express dashboard login (payouts) — opens in a new browser tab from the client.
   */
  async generateStripeDashboardLink(userId: number): Promise<string> {
    const prospect = await this.findCanonicalProspectByUserId(
      this.normalizeUserId(userId),
    );

    if (!prospect?.paymentAccountId) {
      throw new BadRequestException(
        'Connect your Stripe account first to view payouts.',
      );
    }

    try {
      const loginLink = await this.stripe.accounts.createLoginLink(
        prospect.paymentAccountId,
      );
      return loginLink.url;
    } catch (error) {
      console.error('Stripe dashboard link error:', error);
      throw new InternalServerErrorException(
        `Failed to open Stripe dashboard: ${error.message}`,
      );
    }
  }

  /**
   * Get payment onboarding status for tutor
   * @param userId - User ID
   * @returns Payment onboarding status
   */
  async getPaymentOnboardingStatus(userId: number): Promise<{ paymentOnBoarded: boolean }> {
    const prospect = await this.findCanonicalProspectByUserId(
      this.normalizeUserId(userId),
    );

    if (!prospect) {
      throw new NotFoundException(`Prospect not found for user ID ${userId}`);
    }

    return { paymentOnBoarded: prospect.paymentOnBoarded };
  }

  /**
   * Get all prospects with their IDs for debugging
   */
  async getAllProspectsWithIds(): Promise<Array<{ id: number; prospectId: string; fullName: string; status: string }>> {
    const prospects = await this.prospectRepository.find({
      select: ['id', 'prospectId', 'fullName', 'status'],
      order: { createdAt: 'DESC' },
    });

    return prospects.map(p => ({
      id: p.id,
      prospectId: p.prospectId || 'Not generated yet',
      fullName: p.fullName,
      status: p.status,
    }));
  }

  async getAverageTutorResponseHours(tutorUserId: number): Promise<number | null> {
    if (!tutorUserId) return null;
    const convs = await this.conversationRepository.find({
      where: { tutorId: tutorUserId, deletedAt: IsNull() },
      select: ['id', 'studentId', 'tutorId'],
    });
    if (!convs.length) return null;
    const deltasHours: number[] = [];
    for (const c of convs) {
      const msgs = await this.messageRepository.find({
        where: { conversationId: c.id },
        order: { createdAt: 'ASC' },
        select: ['senderId', 'createdAt'],
      });
      let anchor: Date | null = null;
      for (const m of msgs) {
        if (m.senderId === c.studentId) {
          if (!anchor) anchor = m.createdAt;
        } else if (m.senderId === c.tutorId && anchor) {
          if (m.createdAt > anchor) {
            deltasHours.push(
              (m.createdAt.getTime() - anchor.getTime()) / 3600000,
            );
            anchor = null;
            break;
          }
        }
      }
    }
    if (!deltasHours.length) return null;
    const avg =
      deltasHours.reduce((a, b) => a + b, 0) / deltasHours.length;
    return Math.round(avg * 10) / 10;
  }

  async getLearnerMetaForProspect(prospect: Prospect): Promise<{
    subjectPills: ReturnType<typeof buildSubjectPillsFromProspect>;
    feeRangeMin: number;
    feeRangeMax: number;
    averageResponseHours: number | null;
  }> {
    const feeNum =
      prospect.fee != null ? Number(prospect.fee) : NaN;
    const { feeRangeMin, feeRangeMax } = computeFeeRangeFromBaseFee(
      Number.isFinite(feeNum) ? feeNum : undefined,
    );
    const subjectPills = buildSubjectPillsFromProspect(prospect.subjects || '');
    const averageResponseHours = await this.getAverageTutorResponseHours(
      prospect.userId,
    );
    return {
      subjectPills,
      feeRangeMin,
      feeRangeMax,
      averageResponseHours,
    };
  }
}
