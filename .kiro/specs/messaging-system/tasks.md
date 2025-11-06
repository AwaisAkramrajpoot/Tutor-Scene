# Implementation Plan

- [x] 1. Set up database entities and enums





  - Create MessageRequest, Conversation entities and update Message entity to work with conversations
  - Add message request status enum to enums.ts
  - Add proper TypeORM decorators, relationships, and indexes
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1_

- [x] 2. Create DTOs and validation classes





  - [x] 2.1 Implement message request DTOs (CreateMessageRequestDto, UpdateMessageRequestDto)


    - Add validation rules using class-validator
    - _Requirements: 1.1, 2.1_
  
  - [x] 2.2 Implement conversation and message DTOs (CreateMessageDto, MessageQueryDto, SearchMessagesDto)


    - Add pagination and search query validation
    - _Requirements: 4.1, 4.3, 11.1_

- [x] 3. Implement MessageRequestsService













  - [x] 3.1 Create message request with duplicate validation


    - Implement create() method with check for existing pending/accepted requests
    - Validate student can only request tutors
    - _Requirements: 1.1, 1.2, 7.2_
  
  - [x] 3.2 Implement request retrieval methods

    - Create findAllForTutor() and findAllForStudent() methods
    - Filter by status and user role
    - _Requirements: 1.3, 1.4_
  
  - [x] 3.3 Implement accept and reject methods

    - Create accept() method that updates status and creates conversation
    - Create reject() method that updates status only
    - Use database transactions for accept operation
    - _Requirements: 2.1, 2.2, 2.4_



- [x] 4. Implement ConversationsService













  - [x] 4.1 Create conversation retrieval methods

    - Implement findAllForUser() with metadata (last message, unread count)
    - Implement findOne() with access validation
    - Sort by lastMessageAt descending
    - _Requirements: 3.1, 3.2, 3.3, 9.1, 9.2, 9.3_
  

  - [x] 4.2 Implement conversation metadata methods

    - Create getUnreadCount() to calculate unread messages
    - Create getLastMessage() for message preview
    - Create updateLastMessageAt() to update timestamp
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  

  - [x] 4.3 Implement access validation and soft delete

    - Create validateAccess() to check user participation
    - Implement softDelete() method
    - _Requirements: 3.4, 8.1_
-

- [x] 5. Implement MessagesService





  - [x] 5.1 Create message sending functionality

    - Implement create() method with conversation validation
    - Update conversation lastMessageAt timestamp
    - Validate user is conversation participant
    - _Requirements: 4.1, 4.2, 4.5_
  

  - [x] 5.2 Implement message retrieval with pagination

    - Create findByConversation() with pagination support
    - Order messages by createdAt ascending
    - _Requirements: 4.3, 8.2_
  

  - [x] 5.3 Implement read receipt functionality

    - Create markAsRead() to update isRead and readAt fields
    - Mark all unread messages from other participant
    - _Requirements: 4.4, 6.1, 6.3_

- [ ] 6. Implement MessageSearchService









  - [x] 6.1 Create full-text search functionality

    - Implement search() method using database full-text search
    - Filter by user's accessible conversations
    - Return paginated results with conversation context

    - _Requirements: 11.1, 11.2, 11.4_

- [x] 7. Create authentication and authorization guards





  - [x] 7.1 Implement ConversationAccessGuard

    - Validate user is participant before allowing conversation access
    - Use in conversation and message endpoints
    - _Requirements: 3.4, 7.3_
  
  - [x] 7.2 Implement WsJwtGuard for WebSocket authentication


    - Extract and verify JWT from WebSocket handshake
    - Attach user data to socket client
    - _Requirements: 5.1, 7.1, 12.1, 12.2_

- [x] 8. Implement MessageRequestsController





  - [x] 8.1 Create POST /message-requests endpoint

    - Use RolesGuard to ensure only students can create requests
    - Call MessageRequestsService.create()
    - Return created request with 201 status
    - _Requirements: 1.1, 7.2_
  

  - [x] 8.2 Create GET /message-requests endpoint

    - Return pending requests for tutors, all requests for students
    - Use current user from JWT
    - _Requirements: 1.3, 1.4_
  

  - [x] 8.3 Create PATCH /message-requests/:id/accept endpoint

    - Use RolesGuard to ensure only tutors can accept
    - Call MessageRequestsService.accept()
    - Return updated request and created conversation
    - _Requirements: 2.1, 2.3_
  

  - [x] 8.4 Create PATCH /message-requests/:id/reject endpoint

    - Use RolesGuard to ensure only tutors can reject
    - Call MessageRequestsService.reject()
    - Return updated request
    - _Requirements: 2.2, 2.3_

- [x] 9. Implement ConversationsController





  - [x] 9.1 Create GET /conversations endpoint


    - Return all active conversations for current user
    - Include metadata (unread count, last message)
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 9.2 Create GET /conversations/:id endpoint

    - Use ConversationAccessGuard
    - Return conversation details
    - _Requirements: 3.4_
  
  - [x] 9.3 Create GET /conversations/:id/messages endpoint

    - Use ConversationAccessGuard
    - Return paginated messages
    - Mark messages as read when retrieved
    - _Requirements: 4.3, 4.4, 8.2_
  
  - [x] 9.4 Create POST /conversations/:id/messages endpoint

    - Use ConversationAccessGuard
    - HTTP fallback for sending messages
    - Call MessagesService.create()
    - _Requirements: 4.1, 4.2_
  
  - [x] 9.5 Create PATCH /conversations/:id/mark-read endpoint

    - Use ConversationAccessGuard
    - Mark all messages as read
    - _Requirements: 6.1_

- [x] 10. Implement MessagesController






  - [x] 10.1 Create GET /messages/search endpoint

    - Accept search query and pagination parameters
    - Call MessageSearchService.search()
    - Return paginated search results
    - _Requirements: 11.1, 11.2_
-

- [x] 11. Implement WebSocket MessagingGateway





  - [x] 11.1 Set up gateway with authentication

    - Configure @WebSocketGateway with CORS and namespace
    - Use WsJwtGuard for connection authentication
    - Track online users in Map
    - _Requirements: 5.1, 12.1, 12.2_
  

  - [x] 11.2 Implement connection lifecycle handlers

    - Handle afterInit, handleConnection, handleDisconnect
    - Update online status on connect/disconnect
    - Emit userOnline/userOffline events
    - _Requirements: 5.5, 12.3, 12.4_
  

  - [x] 11.3 Implement joinConversation and leaveConversation handlers

    - Validate user access to conversation
    - Join/leave Socket.IO rooms
    - _Requirements: 5.2_
  

  - [x] 11.4 Implement sendMessage handler

    - Validate conversation access
    - Call MessagesService.create()
    - Broadcast newMessage event to conversation room
    - Emit messageDelivered confirmation to sender
    - Update conversation lastMessageAt
    - _Requirements: 4.1, 5.3, 9.4_
  

  - [x] 11.5 Implement typing indicator handler

    - Broadcast userTyping event to conversation room
    - Exclude sender from broadcast
    - _Requirements: 5.4_
  
  - [x] 11.6 Implement markAsRead handler


    - Call MessagesService.markAsRead()
    - Broadcast messageRead event to sender
    - _Requirements: 6.2_

- [x] 12. Implement rate limiting






  - [x] 12.1 Add rate limiting to message sending endpoints

    - Configure throttler for POST /conversations/:id/messages
    - Configure throttler for WebSocket sendMessage event
    - Set limit to 60 messages per minute
    - _Requirements: 7.4_
  

  - [x] 12.2 Add rate limiting to message request creation

    - Configure throttler for POST /message-requests
    - Set limit to 10 requests per hour
    - _Requirements: 7.4_
-

- [x] 13. Implement file upload support





  - [x] 13.1 Create file upload endpoint

    - Add POST /messages/upload endpoint
    - Validate file type (JPEG, PNG, GIF, PDF)
    - Validate file size (5MB for images, 10MB for PDFs)
    - Store file and return URL
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 13.2 Integrate attachment URL in message creation

    - Update CreateMessageDto to accept attachmentUrl
    - Store attachment URL in message record

    - _Requirements: 10.2_

- [x] 14. Implement notification integration




  - [x] 14.1 Create notification triggers for new messages


    - When message is created and receiver is offline, create notification
    - Include message preview and sender info
    - _Requirements: 13.1, 13.3_
  

  - [x] 14.2 Implement notification read on conversation view

    - Mark notifications as read when user views conversation
    - _Requirements: 13.4_
-

- [x] 15. Create messaging module and wire everything together



  - [x] 15.1 Create MessagingModule


    - Import TypeOrmModule with entities
    - Register all controllers, services, and gateway
    - Import AuthModule for guards
    - Configure ThrottlerModule for rate limiting
    - _Requirements: All_
  

  - [x] 15.2 Register MessagingModule in AppModule

    - Add MessagingModule to imports array
    - Ensure proper module dependencies
    - _Requirements: All_
-


- [x] 16. Create database migration



  - [x] 16.1 Generate migration for new entities


    - Create migration for message_request table
    - Create migration for conversation table
    - Create migration to update message table
    - Add all indexes and constraints
    - _Requirements: 8.3_
- [x] 17. Write integration tests





- [ ] 17. Write integration tests


  - [ ]* 17.1 Test message request flow
    - Test creating, accepting, and rejecting requests
    - Test duplicate request prevention
    - Test role-based access control
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 7.2_
  
  - [ ]* 17.2 Test conversation and messaging flow
    - Test conversation creation on request acceptance
    - Test message sending and retrieval
    - Test pagination and read receipts
    - Test access control
    - _Requirements: 3.1, 4.1, 4.3, 6.1_
  
  - [ ]* 17.3 Test WebSocket functionality
    - Test connection authentication
    - Test real-time message delivery
    - Test typing indicators and presence
    - Test reconnection handling
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 12.4_
  
  - [ ]* 17.4 Test search and file upload
    - Test message search functionality
    - Test file upload validation and storage
    - _Requirements: 11.1, 10.1_
