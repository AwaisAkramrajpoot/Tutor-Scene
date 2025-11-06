# Design Document

## Overview

The Tutor Scene messaging system enables students to initiate conversations with tutors through a request-approval workflow, followed by real-time chat communication. The system uses a hybrid approach combining REST APIs for CRUD operations and WebSocket connections for real-time messaging.

### Key Design Principles

1. **Request-First Model**: All conversations begin with a student-initiated message request that tutors must approve
2. **Real-time Communication**: WebSocket connections provide instant message delivery and presence tracking
3. **Security-First**: JWT authentication, role-based access control, and conversation ownership validation
4. **Scalability**: Pagination, efficient queries, and proper indexing for performance
5. **Reliability**: Fallback HTTP endpoints and proper error handling

## Architecture

### High-Level Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │◄───────►│   REST API   │◄───────►│  Database   │
│  (Student/  │         │  Controllers │         │  (Postgres) │
│   Tutor)    │         └──────────────┘         └─────────────┘
└─────────────┘                │
      │                        │
      │                        ▼
      │                 ┌──────────────┐
      └────────────────►│   WebSocket  │
         Socket.IO      │   Gateway    │
                        └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Services   │
                        │   Layer      │
                        └──────────────┘
```

### Module Structure

```
src/modules/messaging/
├── controllers/
│   ├── message-requests.controller.ts
│   ├── conversations.controller.ts
│   └── messages.controller.ts
├── services/
│   ├── message-requests.service.ts
│   ├── conversations.service.ts
│   ├── messages.service.ts
│   └── message-search.service.ts
├── gateways/
│   └── messaging.gateway.ts
├── dto/
│   ├── create-message-request.dto.ts
│   ├── update-message-request.dto.ts
│   ├── create-message.dto.ts
│   ├── message-query.dto.ts
│   └── search-messages.dto.ts
├── guards/
│   ├── conversation-access.guard.ts
│   └── ws-jwt.guard.ts
└── messaging.module.ts
```

## Components and Interfaces

### 1. Database Entities

#### MessageRequest Entity

```typescript
@Entity('message_request')
export class MessageRequest extends BaseEntity {
  @Column({ name: 'student_id' })
  studentId: number;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;
  
  @Column({ name: 'tutor_id' })
  tutorId: number;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutor_id' })
  tutor: User;
  
  @Column({ 
    type: 'enum', 
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  })
  status: string;
  
  @Column({ type: 'text', nullable: true })
  message: string; // Optional initial message
  
  @OneToOne(() => Conversation, conversation => conversation.messageRequest)
  conversation: Conversation;
}
```

#### Conversation Entity

```typescript
@Entity('conversation')
export class Conversation extends BaseEntity {
  @Column({ name: 'message_request_id', unique: true })
  messageRequestId: number;
  
  @OneToOne(() => MessageRequest)
  @JoinColumn({ name: 'message_request_id' })
  messageRequest: MessageRequest;
  
  @Column({ name: 'student_id' })
  studentId: number;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;
  
  @Column({ name: 'tutor_id' })
  tutorId: number;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutor_id' })
  tutor: User;
  
  @Column({ type: 'timestamp', nullable: true, name: 'last_message_at' })
  lastMessageAt: Date;
  
  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt: Date; // Soft delete
  
  @OneToMany(() => Message, message => message.conversation)
  messages: Message[];
}
```

#### Updated Message Entity

```typescript
@Entity('message')
export class Message extends BaseEntity {
  @Column({ name: 'conversation_id' })
  conversationId: number;
  
  @ManyToOne(() => Conversation, conversation => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
  
  @Column({ name: 'sender_id' })
  senderId: number;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;
  
  @Column({ name: 'receiver_id' })
  receiverId: number;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;
  
  @Column({ type: 'text' })
  content: string;
  
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'attachment_url' })
  attachmentUrl: string;
  
  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;
  
  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt: Date;
}
```

### 2. DTOs (Data Transfer Objects)

#### CreateMessageRequestDto
```typescript
export class CreateMessageRequestDto {
  @IsNumber()
  tutorId: number;
  
  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;
}
```

#### CreateMessageDto
```typescript
export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
  
  @IsString()
  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}
```

#### MessageQueryDto
```typescript
export class MessageQueryDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;
  
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
```

### 3. REST API Controllers

#### MessageRequestsController

**Endpoints:**
- `POST /message-requests` - Create new request (student only)
- `GET /message-requests` - Get all requests (filtered by role)
- `PATCH /message-requests/:id/accept` - Accept request (tutor only)
- `PATCH /message-requests/:id/reject` - Reject request (tutor only)

#### ConversationsController

**Endpoints:**
- `GET /conversations` - Get all active conversations
- `GET /conversations/:id` - Get conversation details
- `GET /conversations/:id/messages` - Get paginated messages
- `POST /conversations/:id/messages` - Send message (HTTP fallback)
- `PATCH /conversations/:id/mark-read` - Mark all messages as read

#### MessagesController

**Endpoints:**
- `GET /messages/search` - Search messages across conversations

### 4. WebSocket Gateway

#### MessagingGateway

**Connection Handling:**
```typescript
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/messaging'
})
export class MessagingGateway {
  @WebSocketServer()
  server: Server;
  
  // Track online users
  private onlineUsers: Map<number, string> = new Map();
}
```

**Events to Handle:**
- `joinConversation` - Join conversation room
- `leaveConversation` - Leave conversation room
- `sendMessage` - Send new message
- `typing` - Broadcast typing indicator
- `markAsRead` - Mark messages as read
- `disconnect` - Handle user disconnect

**Events to Emit:**
- `newMessage` - New message received
- `messageDelivered` - Delivery confirmation
- `userTyping` - Typing indicator
- `userOnline` - User online status
- `userOffline` - User offline status
- `messageRead` - Read receipt
- `error` - Error notification

### 5. Services Layer

#### MessageRequestsService

**Key Methods:**
- `create(studentId, dto)` - Create new request with duplicate check
- `findAllForTutor(tutorId)` - Get pending requests for tutor
- `findAllForStudent(studentId)` - Get sent requests for student
- `accept(requestId, tutorId)` - Accept request and create conversation
- `reject(requestId, tutorId)` - Reject request
- `checkExistingRequest(studentId, tutorId)` - Duplicate validation

#### ConversationsService

**Key Methods:**
- `findAllForUser(userId)` - Get conversations with metadata
- `findOne(conversationId, userId)` - Get conversation with access check
- `getUnreadCount(conversationId, userId)` - Calculate unread messages
- `getLastMessage(conversationId)` - Get last message preview
- `updateLastMessageAt(conversationId)` - Update timestamp
- `softDelete(conversationId)` - Soft delete conversation

#### MessagesService

**Key Methods:**
- `create(conversationId, senderId, dto)` - Create message
- `findByConversation(conversationId, query)` - Paginated messages
- `markAsRead(conversationId, userId)` - Mark messages read
- `validateAccess(conversationId, userId)` - Access validation

#### MessageSearchService

**Key Methods:**
- `search(userId, query)` - Full-text search in user's conversations
- `highlightMatches(text, query)` - Highlight search terms

### 6. Guards

#### ConversationAccessGuard

Validates that the authenticated user is a participant in the conversation before allowing access to conversation-related endpoints.

```typescript
@Injectable()
export class ConversationAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;
    const conversationId = request.params.id;
    
    // Validate user is participant
    const hasAccess = await this.conversationsService
      .validateAccess(conversationId, userId);
    
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this conversation');
    }
    
    return true;
  }
}
```

#### WsJwtGuard

Authenticates WebSocket connections using JWT token from handshake.

```typescript
@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth.token;
    
    // Validate JWT and attach user to client
    const user = this.jwtService.verify(token);
    client.data.user = user;
    
    return true;
  }
}
```

## Data Models

### Database Schema

```sql
-- Message Requests Table
CREATE TABLE message_request (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES user(id),
  tutor_id INTEGER NOT NULL REFERENCES user(id),
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, tutor_id, status) WHERE status IN ('pending', 'accepted')
);

CREATE INDEX idx_message_request_student ON message_request(student_id);
CREATE INDEX idx_message_request_tutor ON message_request(tutor_id);
CREATE INDEX idx_message_request_status ON message_request(status);

-- Conversations Table
CREATE TABLE conversation (
  id SERIAL PRIMARY KEY,
  message_request_id INTEGER UNIQUE NOT NULL REFERENCES message_request(id),
  student_id INTEGER NOT NULL REFERENCES user(id),
  tutor_id INTEGER NOT NULL REFERENCES user(id),
  last_message_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversation_student ON conversation(student_id);
CREATE INDEX idx_conversation_tutor ON conversation(tutor_id);
CREATE INDEX idx_conversation_last_message ON conversation(last_message_at DESC);
CREATE INDEX idx_conversation_deleted ON conversation(deleted_at);

-- Messages Table (Updated)
CREATE TABLE message (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversation(id),
  sender_id INTEGER NOT NULL REFERENCES user(id),
  receiver_id INTEGER NOT NULL REFERENCES user(id),
  content TEXT NOT NULL,
  attachment_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_conversation ON message(conversation_id);
CREATE INDEX idx_message_sender ON message(sender_id);
CREATE INDEX idx_message_receiver ON message(receiver_id);
CREATE INDEX idx_message_is_read ON message(is_read);
CREATE INDEX idx_message_created ON message(created_at DESC);
CREATE INDEX idx_message_content_search ON message USING gin(to_tsvector('english', content));
```

### Relationships

```
User (Student) ──1:N──> MessageRequest ──1:1──> Conversation ──1:N──> Message
User (Tutor) ──1:N──> MessageRequest
User (Student) ──1:N──> Conversation
User (Tutor) ──1:N──> Conversation
User ──1:N──> Message (as sender)
User ──1:N──> Message (as receiver)
```

## Error Handling

### Custom Exceptions

```typescript
export class DuplicateMessageRequestException extends ConflictException {
  constructor() {
    super('A message request already exists for this tutor');
  }
}

export class InvalidRoleException extends ForbiddenException {
  constructor(message: string) {
    super(message);
  }
}

export class ConversationAccessDeniedException extends ForbiddenException {
  constructor() {
    super('You do not have access to this conversation');
  }
}
```

### Error Response Format

```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

### WebSocket Error Handling

```typescript
// Emit error events to client
socket.emit('error', {
  event: 'sendMessage',
  message: 'Failed to send message',
  code: 'MESSAGE_SEND_FAILED'
});
```

## Testing Strategy

### Unit Tests

**Services:**
- MessageRequestsService: Test duplicate detection, status transitions
- ConversationsService: Test access validation, metadata calculation
- MessagesService: Test message creation, pagination, read receipts

**Guards:**
- ConversationAccessGuard: Test access validation logic
- WsJwtGuard: Test JWT authentication

### Integration Tests

**REST API:**
- Test complete message request flow (create → accept → conversation)
- Test conversation access control
- Test message sending and retrieval
- Test pagination and search

**WebSocket:**
- Test connection authentication
- Test real-time message delivery
- Test typing indicators
- Test presence tracking
- Test reconnection handling

### E2E Tests

**User Flows:**
1. Student sends request → Tutor accepts → Chat conversation
2. Student sends request → Tutor rejects → No conversation
3. Multiple conversations with unread counts
4. Message search across conversations
5. File attachment upload and retrieval

## Security Considerations

### Authentication
- JWT tokens required for all endpoints
- WebSocket connections authenticated via handshake token
- Token expiration and refresh handling

### Authorization
- Role-based access: Students can only request tutors
- Conversation ownership validation on all operations
- Message request acceptance limited to tutors

### Rate Limiting
- Message sending: 60 messages per minute per user
- Message request creation: 10 requests per hour per student
- Search queries: 30 requests per minute per user

### Data Validation
- Input sanitization for message content
- File type and size validation for attachments
- SQL injection prevention via parameterized queries
- XSS prevention via content escaping

### Privacy
- Users can only access their own conversations
- Soft delete preserves data for audit
- Message content encrypted at rest (optional enhancement)

## Performance Optimizations

### Database
- Proper indexing on foreign keys and query columns
- Pagination for large result sets
- Full-text search index for message content
- Connection pooling

### Caching
- Cache conversation metadata (unread counts, last message)
- Cache user online status
- Redis for WebSocket room management

### WebSocket
- Room-based message broadcasting
- Efficient event handling
- Connection pooling
- Heartbeat mechanism for connection health

## Deployment Considerations

### Environment Variables
```
WEBSOCKET_PORT=3001
WEBSOCKET_CORS_ORIGIN=https://tutorscene.com
MAX_MESSAGE_LENGTH=5000
MAX_FILE_SIZE_MB=10
RATE_LIMIT_MESSAGE_PER_MINUTE=60
```

### Scaling
- Horizontal scaling with Redis adapter for Socket.IO
- Load balancing with sticky sessions
- Database read replicas for queries
- CDN for file attachments

### Monitoring
- WebSocket connection metrics
- Message delivery success rate
- API response times
- Error rates and types
- Active conversation count
