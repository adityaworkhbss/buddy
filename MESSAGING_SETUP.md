# Messaging System Setup Guide

This guide will help you set up the complete messaging system with Socket.IO for real-time chat.

## 📋 Prerequisites

1. Node.js installed
2. PostgreSQL database running
3. Prisma configured

## 🚀 Step-by-Step Setup

### 1. Install Socket.IO Server Dependencies

```bash
npm install socket.io
```

### 2. Update Prisma Schema

The Prisma schema has been updated with `Conversation` and `Message` models. Run the migration:

```bash
npx prisma migrate dev --name add_messaging_tables
```

Or manually run the SQL migration:
```bash
psql -d your_database -f prisma/migrations/add_messaging_schema.sql
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Set Up Environment Variables

Add to your `.env` file:

```env
# Socket.IO Server
SOCKET_PORT=3001
FRONTEND_URL=http://localhost:3000

# Next.js Public (for client-side)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 5. Start Socket.IO Server

#### Option A: Run as separate process

```bash
node server/socket-server.js
```

#### Option B: Use PM2 (Recommended for production)

```bash
npm install -g pm2
pm2 start server/socket-server.js --name socket-server
pm2 save
pm2 startup
```

#### Option C: Add to package.json scripts

Add to `package.json`:

```json
{
  "scripts": {
    "socket": "node server/socket-server.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run socket\""
  }
}
```

Install concurrently:
```bash
npm install --save-dev concurrently
```

Then run both:
```bash
npm run dev:all
```

### 6. File Storage Setup

The messaging system supports file uploads (images, videos). Make sure your `/api/upload` route is configured to handle:

- **Images**: `image/*` (jpg, png, gif, webp)
- **Videos**: `video/*` (mp4, webm, mov)

Files are stored and URLs are saved in the `fileUrl` field of messages.

## 📊 Database Schema

### Conversation Model
- `id`: Unique conversation ID
- `user1Id`: First user ID (always smaller)
- `user2Id`: Second user ID (always larger)
- `lastMessageAt`: Timestamp of last message
- Unique constraint on `(user1Id, user2Id)` to prevent duplicates

### Message Model
- `id`: Unique message ID
- `conversationId`: Reference to conversation
- `senderId`: User who sent the message
- `receiverId`: User who receives the message
- `content`: Text content (nullable for media-only)
- `type`: Message type (`text`, `image`, `video`, `file`)
- `fileUrl`: URL to uploaded file
- `fileName`: Original filename
- `fileSize`: File size in bytes
- `fileType`: MIME type
- `read`: Read status
- `readAt`: When message was read

## 🔌 Socket.IO Events

### Client → Server

1. **`join_user_room`**: Join user's personal room
   ```js
   socket.emit("join_user_room", userId);
   ```

2. **`join_conversation`**: Join a conversation room
   ```js
   socket.emit("join_conversation", conversationId);
   ```

3. **`send_message`**: Send a message
   ```js
   socket.emit("send_message", {
     conversationId,
     senderId,
     receiverId,
     content,
     type,
     fileUrl,
   });
   ```

4. **`typing`**: Send typing indicator
   ```js
   socket.emit("typing", { conversationId, userId, isTyping: true });
   ```

5. **`mark_read`**: Mark messages as read
   ```js
   socket.emit("mark_read", { conversationId, userId });
   ```

### Server → Client

1. **`connected`**: Confirmation of connection
2. **`new_message`**: New message received
3. **`message_sent`**: Confirmation message was saved
4. **`message_error`**: Error sending message
5. **`user_typing`**: User is typing
6. **`messages_read`**: Messages were marked as read

## 📡 API Endpoints

### GET `/api/messages?conversationId={id}`
Fetch all messages for a conversation.

### POST `/api/messages`
Create a new message.
- Body: FormData with `conversationId`, `senderId`, `receiverId`, `content`, `type`, `fileUrl`, etc.

### PUT `/api/messages`
Mark messages as read.
- Body: `{ conversationId, userId }`

### GET `/api/messages/conversations?userId={id}`
Fetch all conversations for a user.

## 🎨 Frontend Features

The MessagePage component includes:

1. **Conversations List**: Shows all conversations with last message preview
2. **Chat Interface**: Real-time message display
3. **File Upload**: Support for images and videos
4. **Message Status**: Shows sending/sent/failed status
5. **Unread Count**: Badge showing unread messages
6. **Connection Status**: Shows if socket is connected

## 🔒 Security Considerations

1. **Authentication**: Add JWT token validation in socket connection
2. **Authorization**: Verify users can only access their conversations
3. **File Validation**: Validate file types and sizes before upload
4. **Rate Limiting**: Implement rate limiting for message sending
5. **Input Sanitization**: Sanitize message content before storing

## 🚀 Production Deployment

1. **Use HTTPS/WSS**: Secure WebSocket connections
2. **Environment Variables**: Set proper URLs for production
3. **Database Indexing**: Ensure indexes are created for performance
4. **Load Balancing**: Use Redis adapter for multiple socket servers
5. **Monitoring**: Set up logging and monitoring for socket server

## 📝 Example: Adding Authentication

Update `server/socket-server.js`:

```js
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT token
  if (verifyToken(token)) {
    next();
  } else {
    next(new Error("Authentication error"));
  }
});
```

## 🐛 Troubleshooting

1. **Socket not connecting**: Check `NEXT_PUBLIC_SOCKET_URL` matches socket server port
2. **Messages not saving**: Verify database connection and Prisma client
3. **Files not uploading**: Check S3/storage configuration
4. **CORS errors**: Update CORS settings in socket server

## 📚 Next Steps

1. Add message reactions/emojis
2. Implement message search
3. Add message deletion/editing
4. Implement read receipts
5. Add typing indicators
6. Implement message pagination for large conversations

