# Requirements Document

## Introduction

This document outlines the requirements for implementing a comprehensive messaging system for the Tutor Scene platform. The system enables students to send message requests to tutors, and upon acceptance, facilitates real-time chat communication between them.

## Glossary

- **System**: The Tutor Scene messaging system
- **Student**: A user with role 'student' who can initiate message requests
- **Tutor**: A user with role 'tutor' who can accept or reject message requests
- **Message Request**: An initial request from a student to start a conversation with a tutor
- **Conversation**: An active chat session between a student and tutor after request acceptance
- **WebSocket Gateway**: Real-time communication channel using Socket.IO

## Requirements

### Requirement 1: Message Request Management

**User Story:** As a student, I want to send message requests to tutors, so that I can initiate conversations with potential tutors.

#### Acceptance Criteria

1. WHEN a student submits a message request to a tutor, THE System SHALL create a new message request record with status 'pending'
2. IF a student attempts to create a message request for a tutor where an active or pending request exists, THEN THE System SHALL reject the request with a conflict error
3. WHEN a tutor views their message requests, THE System SHALL return all pending requests sent to them
4. WHEN a student views their message requests, THE System SHALL return all sent requests with their current status
5. THE System SHALL store an optional initial message with each message request

### Requirement 2: Message Request Response

**User Story:** As a tutor, I want to accept or reject message requests from students, so that I can control who I communicate with.

#### Acceptance Criteria

1. WHEN a tutor accepts a message request, THE System SHALL update the request status to 'accepted' and create a new conversation record
2. WHEN a tutor rejects a message request, THE System SHALL update the request status to 'rejected'
3. IF a non-tutor user attempts to accept or reject a message request, THEN THE System SHALL reject the operation with a forbidden error
4. WHEN a message request is accepted, THE System SHALL link the conversation to the message request via messageRequestId

### Requirement 3: Conversation Access Control

**User Story:** As a user, I want to access only my own conversations, so that my communications remain private.

#### Acceptance Criteria

1. WHEN a user requests their conversations, THE System SHALL return only conversations where the user is either the student or tutor
2. THE System SHALL include the last message timestamp and unread message count for each conversation
3. THE System SHALL sort conversations by last activity in descending order
4. IF a user attempts to access a conversation they are not part of, THEN THE System SHALL reject the request with a forbidden error

### Requirement 4: Message Sending and Retrieval

**User Story:** As a user, I want to send and receive messages in my conversations, so that I can communicate with other users.

#### Acceptance Criteria

1. WHEN a user sends a message in a conversation, THE System SHALL create a message record with senderId, receiverId, and content
2. THE System SHALL validate that the user is a participant in the conversation before allowing message sending
3. WHEN a user requests message history for a conversation, THE System SHALL return paginated messages ordered by creation time
4. THE System SHALL mark messages as read when the receiver views them
5. THE System SHALL update the conversation's lastMessageAt timestamp when a new message is sent

### Requirement 5: Real-time Communication

**User Story:** As a user, I want to receive messages instantly, so that I can have real-time conversations.

#### Acceptance Criteria

1. WHEN a user connects to the WebSocket gateway, THE System SHALL authenticate the user using JWT token
2. WHEN a user joins a conversation room, THE System SHALL add them to the Socket.IO room for that conversation
3. WHEN a message is sent via WebSocket, THE System SHALL broadcast the message to all participants in the conversation room
4. WHEN a user starts typing, THE System SHALL broadcast a typing indicator to other participants
5. THE System SHALL track and broadcast user online/offline status changes

### Requirement 6: Message Read Receipts

**User Story:** As a user, I want to know when my messages have been read, so that I can track message delivery.

#### Acceptance Criteria

1. WHEN a user views messages in a conversation, THE System SHALL mark all unread messages from the other participant as read
2. WHEN a message is marked as read, THE System SHALL broadcast a read receipt event to the sender
3. THE System SHALL store the read status and read timestamp for each message

### Requirement 7: Authorization and Security

**User Story:** As a system administrator, I want to ensure secure messaging, so that unauthorized access is prevented.

#### Acceptance Criteria

1. THE System SHALL require JWT authentication for all messaging endpoints and WebSocket connections
2. THE System SHALL validate that students can only send message requests to users with role 'tutor'
3. THE System SHALL prevent users from accessing conversations they are not participants in
4. THE System SHALL implement rate limiting on message sending to prevent spam
5. IF an unauthorized access attempt is detected, THEN THE System SHALL reject the request with appropriate error codes

### Requirement 8: Data Management

**User Story:** As a system administrator, I want proper data management, so that the system remains performant and compliant.

#### Acceptance Criteria

1. THE System SHALL implement soft delete for conversations to preserve message history
2. THE System SHALL support pagination for message history with configurable page size
3. THE System SHALL maintain referential integrity between message requests, conversations, and messages
4. THE System SHALL log all critical operations for debugging and audit purposes
5. WHERE a message request has status 'rejected' and is older than 30 days, THE System SHALL permanently delete the request record

### Requirement 9: Conversation Metadata

**User Story:** As a user, I want to see conversation previews and unread counts, so that I can prioritize my communications.

#### Acceptance Criteria

1. WHEN a user views their conversation list, THE System SHALL include the last message content preview for each conversation
2. THE System SHALL calculate and return the unread message count for each conversation
3. THE System SHALL display the timestamp of the last message in each conversation
4. THE System SHALL update conversation metadata in real-time when new messages arrive

### Requirement 10: File and Attachment Support

**User Story:** As a user, I want to send files and images in messages, so that I can share resources with other users.

#### Acceptance Criteria

1. WHEN a user uploads a file attachment, THE System SHALL validate the file type and size
2. THE System SHALL store the attachment URL in the message record
3. THE System SHALL support image file formats (JPEG, PNG, GIF) with maximum size of 5MB
4. THE System SHALL support document file formats (PDF) with maximum size of 10MB
5. IF an invalid file type or oversized file is uploaded, THEN THE System SHALL reject the upload with a validation error

### Requirement 11: Message Search

**User Story:** As a user, I want to search my message history, so that I can find specific conversations or information.

#### Acceptance Criteria

1. WHEN a user performs a message search, THE System SHALL search message content within their accessible conversations
2. THE System SHALL return paginated search results with conversation context
3. THE System SHALL highlight matching text in search results
4. THE System SHALL support case-insensitive text search

### Requirement 12: WebSocket Connection Management

**User Story:** As a user, I want reliable real-time messaging, so that my messages are delivered even with connection issues.

#### Acceptance Criteria

1. WHEN a user's WebSocket connection is established, THE System SHALL authenticate using JWT token from handshake
2. IF authentication fails, THEN THE System SHALL reject the WebSocket connection
3. WHEN a user disconnects, THE System SHALL update their online status to offline
4. WHEN a user reconnects, THE System SHALL restore their conversation room subscriptions
5. THE System SHALL implement automatic reconnection logic on the client side

### Requirement 13: Notification Integration

**User Story:** As a user, I want to receive notifications for new messages, so that I don't miss important communications.

#### Acceptance Criteria

1. WHEN a new message is received and the recipient is offline, THE System SHALL create an in-app notification
2. WHERE push notifications are enabled for the user, THE System SHALL send a push notification for new messages
3. THE System SHALL include message preview and sender information in notifications
4. WHEN a user views a conversation, THE System SHALL mark related notifications as read
