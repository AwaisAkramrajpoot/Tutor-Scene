import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { Message } from '@/database/entities/message.entity';
import { MessageRequest } from '@/database/entities/message-request.entity';
import { Conversation } from '@/database/entities/conversation.entity';
import { User } from '@/database/entities/user.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { MessageRequestsService } from './services/message-requests.service';
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';
import { MessageSearchService } from './services/message-search.service';
import { MessageRequestsController } from './controllers/message-requests.controller';
import { ConversationsController } from './controllers/conversations.controller';
import { MessagesController } from './controllers/messages.controller';
import { MessagingGateway } from './gateways/messaging.gateway';
import { ConversationAccessGuard } from './guards/conversation-access.guard';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { AuthModule } from '@/modules/auth/auth.module';
import { FileUploadModule } from '@/modules/file-upload/file-upload.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([Message, MessageRequest, Conversation, User, Prospect]),
    
    // Auth module for guards (JwtAuthGuard, RolesGuard)
    AuthModule,
    
    // File upload support for attachments
    FileUploadModule,
    
    // Notifications for offline message alerts
    NotificationsModule,
    
    // Rate limiting configuration for messaging endpoints
    ThrottlerModule.forRoot([
      {
        name: 'message-sending',
        ttl: 60000, // 60 seconds
        limit: 60, // 60 messages per minute
      },
      {
        name: 'message-requests',
        ttl: 3600000, // 1 hour
        limit: 10, // 10 requests per hour
      },
    ]),
  ],
  controllers: [
    MessageRequestsController,
    ConversationsController,
    MessagesController,
  ],
  providers: [
    // Services
    MessageRequestsService,
    ConversationsService,
    MessagesService,
    MessageSearchService,
    
    // WebSocket Gateway
    MessagingGateway,
    
    // Guards
    ConversationAccessGuard,
    WsJwtGuard,
  ],
  exports: [
    MessageRequestsService,
    ConversationsService,
    MessagesService,
    MessageSearchService,
  ],
})
export class MessagingModule {}
