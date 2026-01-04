# Socket.IO Server Setup for Real-Time Messaging

## Quick Start

To enable real-time messaging (messages appear instantly without refresh), you need to start the Socket.IO server.

### Option 1: Run Socket Server Separately (Recommended)

1. Open a **new terminal window**
2. Run:
   ```bash
   npm run socket
   ```
   
   You should see: `Socket.IO server running on port 3001`

3. Keep this terminal open while developing

### Option 2: Run Both Servers Together

1. Install concurrently (if not already installed):
   ```bash
   npm install --save-dev concurrently
   ```

2. Run both Next.js and Socket server together:
   ```bash
   npm run dev:all
   ```

## Verify It's Working

1. Open your browser console (F12)
2. Look for: `✅ Socket connected: [socket-id]`
3. The connection indicator in the Messages page should turn **green**

## Troubleshooting

- **WebSocket errors**: Make sure the socket server is running on port 3001
- **Messages not appearing in real-time**: Check browser console for socket connection status
- **Connection indicator is gray**: Socket server is not running or not connected

## Environment Variables

Make sure these are set in your `.env` file:
```env
SOCKET_PORT=3001
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

