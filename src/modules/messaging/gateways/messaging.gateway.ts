import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { WsThrottlerGuard } from '../guards/ws-throttler.guard';
import { MessagesService } from '../services/messages.service';
import { ConversationsService } from '../services/conversations.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { User } from '@/database/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * WebSocket Gateway for real-time messaging
 * Handles connection lifecycle, message sending, typing indicators, and presence tracking
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 12.1, 12.2, 12.3, 12.4
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Configure based on environment
    credentials: true,
  },
  namespace: '/messaging',
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  
  // Track online users: userId -> socketId
  private onlineUsers: Map<number, string> = new Map();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly conversationsService: ConversationsService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Check if a user is currently online
   */
  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Gateway initialization
   * Requirements: 5.1
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  /**
   * Handle client connection
   * Requirements: 5.5, 12.3, 12.4
   */
  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // Manually authenticate the connection
      const token = this.extractToken(client);
      
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.emit('error', {
          event: 'connection',
          message: 'Authentication token not provided',
          code: 'NO_TOKEN',
        });
        client.disconnect();
        return;
      }

      // Verify JWT token
      try {
        const payload = this.jwtService.verify(token);
        
        // Validate token type
        if (payload.type !== 'access') {
          this.logger.warn(`Connection rejected: Invalid token type`);
          client.emit('error', {
            event: 'connection',
            message: 'Invalid token type',
            code: 'INVALID_TOKEN_TYPE',
          });
          client.disconnect();
          return;
        }

        // Fetch user from database
        const user = await this.userRepository.findOne({
          where: { id: payload.sub },
        });

        if (!user || !user.isActive()) {
          this.logger.warn(`Connection rejected: User not found or inactive`);
          client.emit('error', {
            event: 'connection',
            message: 'User not found or inactive',
            code: 'USER_NOT_FOUND',
          });
          client.disconnect();
          return;
        }

        // Attach user to socket client data
        client.data.user = user;
      } catch (error) {
        this.logger.warn(`Connection rejected: ${error.message}`);
        client.emit('error', {
          event: 'connection',
          message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Authentication failed',
          code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'AUTH_FAILED',
        });
        client.disconnect();
        return;
      }

      const user: User = client.data.user;

      this.logger.log(`Client connected: ${client.id} (User: ${user.id})`);

      // Track online user
      this.onlineUsers.set(user.id, client.id);

      // Broadcast user online status
      this.server.emit('userOnline', {
        userId: user.id,
        timestamp: new Date(),
      });

      // Send connection confirmation to client
      client.emit('connected', {
        message: 'Successfully connected to messaging service',
        userId: user.id,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`, error.stack);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   * Requirements: 5.5, 12.3, 12.4
   */
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      const user: User = client.data.user;

      if (user) {
        this.logger.log(`Client disconnected: ${client.id} (User: ${user.id})`);

        // Remove from online users
        this.onlineUsers.delete(user.id);

        // Broadcast user offline status
        this.server.emit('userOffline', {
          userId: user.id,
          timestamp: new Date(),
        });
      } else {
        this.logger.log(`Client disconnected: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(`Disconnection error: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle user joining a conversation room
   * Requirements: 5.2
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    try {
      const user: User = client.data.user;
      const { conversationId } = data;

      // Validate user access to conversation
      const conversation = await this.conversationsService.findOne(
        conversationId,
        user.id,
      );

      if (!conversation) {
        client.emit('error', {
          event: 'joinConversation',
          message: 'Conversation not found or access denied',
          code: 'CONVERSATION_ACCESS_DENIED',
        });
        return;
      }

      // Join Socket.IO room
      const roomName = `conversation:${conversationId}`;
      await client.join(roomName);

      this.logger.log(
        `User ${user.id} joined conversation ${conversationId} (Room: ${roomName})`,
      );

      // Send confirmation to client
      client.emit('joinedConversation', {
        conversationId,
        message: 'Successfully joined conversation',
      });
    } catch (error) {
      this.logger.error(
        `Error joining conversation: ${error.message}`,
        error.stack,
      );
      client.emit('error', {
        event: 'joinConversation',
        message: 'Failed to join conversation',
        code: 'JOIN_CONVERSATION_FAILED',
      });
    }
  }

  /**
   * Handle user leaving a conversation room
   * Requirements: 5.2
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    try {
      const user: User = client.data.user;
      const { conversationId } = data;

      // Leave Socket.IO room
      const roomName = `conversation:${conversationId}`;
      await client.leave(roomName);

      this.logger.log(
        `User ${user.id} left conversation ${conversationId} (Room: ${roomName})`,
      );

      // Send confirmation to client
      client.emit('leftConversation', {
        conversationId,
        message: 'Successfully left conversation',
      });
    } catch (error) {
      this.logger.error(
        `Error leaving conversation: ${error.message}`,
        error.stack,
      );
      client.emit('error', {
        event: 'leaveConversation',
        message: 'Failed to leave conversation',
        code: 'LEAVE_CONVERSATION_FAILED',
      });
    }
  }

  /**
   * Handle sending a message in a conversation
   * Requirements: 4.1, 5.3, 7.4, 9.4
   */
  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 messages per minute
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; content: string; attachmentUrl?: string },
  ) {
    try {
      const user: User = client.data.user;
      const { conversationId, content, attachmentUrl } = data;

      // Validate conversation access
      const conversation = await this.conversationsService.findOne(
        conversationId,
        user.id,
      );

      if (!conversation) {
        client.emit('error', {
          event: 'sendMessage',
          message: 'Conversation not found or access denied',
          code: 'CONVERSATION_ACCESS_DENIED',
        });
        return;
      }

      // Create message DTO
      const createMessageDto: CreateMessageDto = {
        content,
        attachmentUrl,
      };

      // Determine receiver ID and check if online
      const receiverId = conversation.studentId === user.id 
        ? conversation.tutorId 
        : conversation.studentId;
      const isReceiverOnline = this.isUserOnline(receiverId);

      // Create message using MessagesService
      const message = await this.messagesService.create(
        conversationId,
        user.id,
        createMessageDto,
        isReceiverOnline,
      );

      // Update conversation lastMessageAt (already done in service, but ensure it's updated)
      await this.conversationsService.updateLastMessageAt(conversationId);

      // Broadcast newMessage event to conversation room
      const roomName = `conversation:${conversationId}`;
      this.server.to(roomName).emit('newMessage', {
        message: {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          attachmentUrl: message.attachmentUrl,
          isRead: message.isRead,
          createdAt: message.createdAt,
        },
      });

      // Emit messageDelivered confirmation to sender
      client.emit('messageDelivered', {
        messageId: message.id,
        conversationId,
        timestamp: message.createdAt,
      });

      this.logger.log(
        `Message sent by user ${user.id} in conversation ${conversationId}`,
      );
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      client.emit('error', {
        event: 'sendMessage',
        message: error.message || 'Failed to send message',
        code: 'MESSAGE_SEND_FAILED',
      });
    }
  }

  /**
   * Handle typing indicator
   * Requirements: 5.4
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; isTyping: boolean },
  ) {
    try {
      const user: User = client.data.user;
      const { conversationId, isTyping } = data;

      // Validate conversation access
      const conversation = await this.conversationsService.findOne(
        conversationId,
        user.id,
      );

      if (!conversation) {
        return; // Silently fail for typing indicators
      }

      // Broadcast userTyping event to conversation room, excluding sender
      const roomName = `conversation:${conversationId}`;
      client.to(roomName).emit('userTyping', {
        conversationId,
        userId: user.id,
        isTyping,
        timestamp: new Date(),
      });

      this.logger.debug(
        `User ${user.id} typing status: ${isTyping} in conversation ${conversationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling typing indicator: ${error.message}`,
        error.stack,
      );
      // Don't emit error for typing indicators - fail silently
    }
  }

  /**
   * Extract JWT token from WebSocket handshake
   * Supports both auth.token and query.token formats
   */
  private extractToken(client: Socket): string | null {
    // Try to get token from auth object (preferred method)
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    // Fallback to query parameter
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }

    // Try to extract from Authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Handle marking messages as read
   * Requirements: 6.2
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    try {
      const user: User = client.data.user;
      const { conversationId } = data;

      // Validate conversation access
      const conversation = await this.conversationsService.findOne(
        conversationId,
        user.id,
      );

      if (!conversation) {
        client.emit('error', {
          event: 'markAsRead',
          message: 'Conversation not found or access denied',
          code: 'CONVERSATION_ACCESS_DENIED',
        });
        return;
      }

      // Mark messages as read using MessagesService
      const affectedCount = await this.messagesService.markAsRead(
        conversationId,
        user.id,
      );

      // Broadcast messageRead event to the other participant (sender)
      const roomName = `conversation:${conversationId}`;
      client.to(roomName).emit('messageRead', {
        conversationId,
        userId: user.id,
        count: affectedCount,
        timestamp: new Date(),
      });

      // Send confirmation to client
      client.emit('markedAsRead', {
        conversationId,
        count: affectedCount,
      });

      this.logger.log(
        `User ${user.id} marked ${affectedCount} messages as read in conversation ${conversationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error marking messages as read: ${error.message}`,
        error.stack,
      );
      client.emit('error', {
        event: 'markAsRead',
        message: 'Failed to mark messages as read',
        code: 'MARK_AS_READ_FAILED',
      });
    }
  }
}
