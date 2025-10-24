import { Controller, Post, Delete, Body, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('File Upload')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('profile-photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile photo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Photo uploaded successfully' })
  uploadProfilePhoto(@UploadedFile() file: Express.Multer.File) {
    return this.fileUploadService.uploadProfilePhoto(file);
  }

  @Post('resume')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload resume (PDF or DOC)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Resume uploaded successfully' })
  uploadResume(@UploadedFile() file: Express.Multer.File) {
    return this.fileUploadService.uploadResume(file);
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload document' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  uploadDocument(@UploadedFile() file: Express.Multer.File) {
    return this.fileUploadService.uploadDocument(file);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a file from S3' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  deleteFile(@Body('url') url: string) {
    return this.fileUploadService.deleteFile(url);
  }
}
