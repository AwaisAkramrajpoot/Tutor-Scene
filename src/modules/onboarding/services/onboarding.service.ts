import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prospect } from '@/database/entities/prospect.entity';
import { OnboardingDto } from '../dto/onboarding.dto';
import { FileType } from '../dto/file-upload.dto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Prospect)
    private prospectRepository: Repository<Prospect>,
  ) {}

  /**
   * Store file in S3 storage with validation
   * @param fileBuffer - The file buffer
   * @param fileName - The original file name
   * @param mimeType - The MIME type of the file
   * @param s3BucketUrl - The S3 bucket URL
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
    
    // In a real implementation, this would upload to S3
    // For now, we'll simulate the S3 URL
    const s3Url = `${s3BucketUrl}/${uniqueFileName}`;
    
    // In a real implementation, you would use the AWS SDK to upload:
    /*
    const s3 = new AWS.S3();
    const params = {
      Bucket: s3BucketName,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: mimeType,
    };
    
    try {
      const result = await s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
    */
    
    // For demonstration purposes, we're returning a simulated S3 URL
    return s3Url;
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
      const prospect = this.prospectRepository.create(onboardingDto);
      return await this.prospectRepository.save(prospect);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to save prospect information',
      );
    }
  }
}