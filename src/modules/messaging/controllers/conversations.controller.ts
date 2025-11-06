import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConversationsService } from '../services/conversations.service';
import { MessagesService } from '../services/messages.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ConversationAccessGuard } from '../guards/conversation-access.guard';
import { CurrentUser } from '@/modules/auth/decorators/auth.decorator';
import { User } from '@/database/entities/user.entity';
import { NotificationsService } from '@/modules/notifications/notifications.service';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Helper method to check if user is online via WebSocket
   * For HTTP fallback, we assume user might be offline
   */
  private isUserOnline(userId: number): boolean {
    // In HTTP context, we don't have direct access to WebSocket gateway
    // So we'll default to false to ensure notifications are sent
    // This is a conservative approach for the HTTP fallback
    return false;
  }

  /**
   * Get all active conversations for current user
   * Requirements: 3.1, 3.2, 3.3
   */
  @Get()
  @ApiOperation({ 
    summary: 'Get all active conversations for current user',
    description: 'Returns all conversations with metadata including unread count and last message'
  })
  @ApiResponse({
    status: 200,
    description: 'List of conversations with metadata',
  })
  async findAll(@CurrentUser() user: User) {
    return this.conversationsService.findAllForUser(user.id);
  }

  /**
   * Get conversation details by ID
   * Requirements: 3.4
   */
  @Get(':id')
  @UseGuards(ConversationAccessGuard)
  @ApiOperation({ 
    summary: 'Get conversation details',
    description: 'Returns conversation details for the specified ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation details',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this conversation',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.conversationsService.findOne(id, user.id);
  }

  /**
   * Get paginated messages for a conversation
   * Requirements: 4.3, 4.4, 8.2, 13.4
   */
  @Get(':id/messages')
  @UseGuards(ConversationAccessGuard)
  @ApiOperation({ 
    summary: 'Get paginated messages for a conversation',
    description: 'Returns paginated messages and marks them as read when retrieved'
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated messages',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this conversation',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  async getMessages(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: MessageQueryDto,
  ) {
    // Get paginated messages
    const result = await this.messagesService.findByConversation(
      id,
      user.id,
      query,
    );

    // Mark messages as read when retrieved
    await this.messagesService.markAsRead(id, user.id);

    // Mark related notifications as read when user views conversation
    // Requirements: 13.4
    const actionUrl = `/conversations/${id}`;
    await this.notificationsService.markAsReadByActionUrl(user.id, actionUrl);

    return result;
  }

  /**
   * Send a message in a conversation (HTTP fallback)
   * Requirements: 4.1, 4.2, 7.4
   */
  @Post(':id/messages')
  @UseGuards(ConversationAccessGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 messages per minute
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Send a message in a conversation',
    description: 'HTTP fallback for sending messages (WebSocket is preferred). Rate limited to 60 messages per minute.'
  })
  @ApiResponse({
    status: 201,
    description: 'Message successfully sent',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this conversation',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  async sendMessage(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    // For HTTP fallback, assume receiver is offline to ensure notification is sent
    const isReceiverOnline = this.isUserOnline(user.id);
    return this.messagesService.create(id, user.id, createMessageDto, isReceiverOnline);
  }

  /**
   * Mark all messages as read in a conversation
   * Requirements: 6.1
   */
  @Patch(':id/mark-read')
  @UseGuards(ConversationAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Mark all messages as read',
    description: 'Marks all unread messages from the other participant as read'
  })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this conversation',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const affectedCount = await this.messagesService.markAsRead(id, user.id);
    return {
      success: true,
      markedAsRead: affectedCount,
    };
  }

  /**
   * Get recently contacted tutors for a student
   */
  @Get('student/:studentId/recent-tutors')
  @ApiOperation({ 
    summary: 'Get recently contacted tutors',
    description: 'Returns the 3 most recently contacted tutors with their information for a student'
  })
  @ApiResponse({
    status: 200,
    description: 'List of recently contacted tutors with their information',
  })
  async getRecentlyContactedTutors(
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.conversationsService.getRecentlyContactedTutors(studentId);
  }
}
