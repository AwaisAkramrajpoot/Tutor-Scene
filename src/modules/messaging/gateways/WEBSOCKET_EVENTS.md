# WebSocket Messaging Events

This document describes the WebSocket events available in the MessagingGateway.

## Connection

### Namespace
`/messaging`

### Authentication
All connections require JWT authentication via the `WsJwtGuard`. Pass the token in one of these ways:
- `auth.token` in the handshake
- `query.token` in the connection URL
- `Authorization: Bearer <token>` header

## Client → Server Events

### `joinConversation`
Join a conversation room to receive real-time updates.

**Payload:**
```typescript
{
  conversationId: number
}
```

**Response Events:**
- `joinedConversation` - Success confirmation
- `error` - If access denied or conversation not found

---

### `leaveConversation`
Leave a conversation room.

**Payload:**
```typescript
{
  conversationId: number
}
```

**Response Events:**
- `leftConversation` - Success confirmation
- `error` - If operation fails

---

### `sendMessage`
Send a message in a conversation.

**Payload:**
```typescript
{
  conversationId: number;
  content: string;
  attachmentUrl?: string;
}
```

**Response Events:**
- `messageDelivered` - Confirmation to sender
- `newMessage` - Broadcast to all participants in the conversation room
- `error` - If sending fails

---

### `typing`
Broadcast typing indicator to other participants.

**Payload:**
```typescript
{
  conversationId: number;
  isTyping: boolean;
}
```

**Response Events:**
- `userTyping` - Broadcast to other participants (excludes sender)

---

### `markAsRead`
Mark all unread messages in a conversation as read.

**Payload:**
```typescript
{
  conversationId: number;
}
```

**Response Events:**
- `markedAsRead` - Confirmation to sender
- `messageRead` - Broadcast to other participant
- `error` - If operation fails

---

## Server → Client Events

### `connected`
Sent when client successfully connects.

**Payload:**
```typescript
{
  message: string;
  userId: number;
}
```

---

### `userOnline`
Broadcast when a user comes online.

**Payload:**
```typescript
{
  userId: number;
  timestamp: Date;
}
```

---

### `userOffline`
Broadcast when a user goes offline.

**Payload:**
```typescript
{
  userId: number;
  timestamp: Date;
}
```

---

### `joinedConversation`
Confirmation that user joined a conversation room.

**Payload:**
```typescript
{
  conversationId: number;
  message: string;
}
```

---

### `leftConversation`
Confirmation that user left a conversation room.

**Payload:**
```typescript
{
  conversationId: number;
  message: string;
}
```

---

### `newMessage`
Broadcast to all participants when a new message is sent.

**Payload:**
```typescript
{
  message: {
    id: number;
    conversationId: number;
    senderId: number;
    receiverId: number;
    content: string;
    attachmentUrl?: string;
    isRead: boolean;
    createdAt: Date;
  }
}
```

---

### `messageDelivered`
Confirmation to sender that message was delivered.

**Payload:**
```typescript
{
  messageId: number;
  conversationId: number;
  timestamp: Date;
}
```

---

### `userTyping`
Broadcast to other participants when someone is typing.

**Payload:**
```typescript
{
  conversationId: number;
  userId: number;
  isTyping: boolean;
  timestamp: Date;
}
```

---

### `messageRead`
Broadcast to sender when their messages are read.

**Payload:**
```typescript
{
  conversationId: number;
  userId: number;
  count: number;
  timestamp: Date;
}
```

---

### `markedAsRead`
Confirmation that messages were marked as read.

**Payload:**
```typescript
{
  conversationId: number;
  count: number;
}
```

---

### `error`
Error notification for failed operations.

**Payload:**
```typescript
{
  event: string;
  message: string;
  code: string;
}
```

**Error Codes:**
- `CONVERSATION_ACCESS_DENIED` - User doesn't have access to conversation
- `JOIN_CONVERSATION_FAILED` - Failed to join conversation room
- `LEAVE_CONVERSATION_FAILED` - Failed to leave conversation room
- `MESSAGE_SEND_FAILED` - Failed to send message
- `MARK_AS_READ_FAILED` - Failed to mark messages as read

---

## Example Client Usage

```typescript
import { io } from 'socket.io-client';

// Connect with authentication
const socket = io('http://localhost:3000/messaging', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for connection
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

// Join a conversation
socket.emit('joinConversation', { conversationId: 1 });

// Listen for new messages
socket.on('newMessage', (data) => {
  console.log('New message:', data.message);
});

// Send a message
socket.emit('sendMessage', {
  conversationId: 1,
  content: 'Hello!'
});

// Listen for typing indicators
socket.on('userTyping', (data) => {
  console.log(`User ${data.userId} is typing:`, data.isTyping);
});

// Send typing indicator
socket.emit('typing', {
  conversationId: 1,
  isTyping: true
});

// Mark messages as read
socket.emit('markAsRead', { conversationId: 1 });

// Listen for errors
socket.on('error', (error) => {
  console.error('Error:', error);
});
```
