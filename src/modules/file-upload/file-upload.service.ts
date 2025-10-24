import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Service } from './s3.service';

@Injectable()
export class FileUploadService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadProfilePhoto(file: Express.Multer.File): Promise<{ url: string }> {
    this.validateImage(file);
    const url = await this.s3Service.uploadFile(file, 'profile-photos');
    return { url };
  }

  async uploadResume(file: Express.Multer.File): Promise<{ url: string }> {
    this.validateDocument(file);
    const url = await this.s3Service.uploadFile(file, 'resumes');
    return { url };
  }

  async uploadDocument(file: Express.Multer.File): Promise<{ url: string }> {
    this.validateDocument(file);
    const url = await this.s3Service.uploadFile(file, 'documents');
    return { url };
  }

  async deleteFile(fileUrl: string): Promise<{ message: string }> {
    await this.s3Service.deleteFile(fileUrl);
    return { message: 'File deleted successfully' };
  }

  private validateImage(file: Express.Multer.File): void {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, JPG, and PNG images are allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }
  }

  private validateDocument(file: Express.Multer.File): void {
    const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and DOC files are allowed');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }
  }
}
