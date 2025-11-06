import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageSearchService } from '../services/message-search.service';
import { SearchMessagesDto } from '../dto/search-messages.dto';
import { UploadFileDto } from '../dto/upload-file.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/auth.decorator';
import { User } from '@/database/entities/user.entity';
import { S3Service } from '@/modules/file-upload/s3.service';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(
    private readonly messageSearchService: MessageSearchService,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Search messages across all user's conversations
   * Requirements: 11.1, 11.2
   */
  @Get('search')
  @ApiOperation({ 
    summary: 'Search messages across conversations',
    description: 'Performs full-text search on message content within user\'s accessible conversations'
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated search results with conversation context',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: {
                type: 'object',
                description: 'Message object with sender and receiver details'
              },
              conversation: {
                type: 'object',
                description: 'Conversation context'
              },
              highlightedContent: {
                type: 'string',
                description: 'Message content with search terms highlighted'
              }
            }
          }
        },
        total: {
          type: 'number',
          description: 'Total number of matching messages'
        },
        page: {
          type: 'number',
          description: 'Current page number'
        },
        limit: {
          type: 'number',
          description: 'Results per page'
        },
        totalPages: {
          type: 'number',
          description: 'Total number of pages'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async search(
    @CurrentUser() user: User,
    @Query() searchDto: SearchMessagesDto,
  ) {
    return this.messageSearchService.search(user.id, searchDto);
  }

  /**
   * Upload file attachment for messages
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
   */
  @Post('upload')
  @ApiOperation({
    summary: 'Upload file attachment',
    description: 'Upload a file (image or PDF) to be attached to a message. Returns the file URL.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    type: UploadFileDto,
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the uploaded file',
          example: 'https://tutor-scene-uploads.s3.us-east-1.amazonaws.com/message-attachments/1234567890-document.pdf',
        },
        filename: {
          type: 'string',
          description: 'Original filename',
          example: 'document.pdf',
        },
        mimetype: {
          type: 'string',
          description: 'File MIME type',
          example: 'application/pdf',
        },
        size: {
          type: 'number',
          description: 'File size in bytes',
          example: 1024000,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or size',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const allowedDocumentTypes = ['application/pdf'];
    const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.',
      );
    }

    // Validate file size
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxDocumentSize = 10 * 1024 * 1024; // 10MB

    if (allowedImageTypes.includes(file.mimetype) && file.size > maxImageSize) {
      throw new BadRequestException(
        'Image file size exceeds 5MB limit',
      );
    }

    if (allowedDocumentTypes.includes(file.mimetype) && file.size > maxDocumentSize) {
      throw new BadRequestException(
        'PDF file size exceeds 10MB limit',
      );
    }

    // Upload to S3
    const folder = 'message-attachments';
    const url = await this.s3Service.uploadFile(file, folder);

    return {
      url,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
