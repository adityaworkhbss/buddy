/**
 * Socket.IO Server Setup
 * 
 * This file should be run as a separate Node.js server.
 * Install dependencies: npm install socket.io
 * 
 * Run with: node server/socket-server.js
 * Or use PM2: pm2 start server/socket-server.js --name socket-server
 */

const { Server } = require("socket.io");
const http = require("http");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Create HTTP server
const server = http.createServer();

// Initialize Socket.IO
// Allow multiple origins for CORS (Vercel app + localhost for development)
const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ["http://localhost:3000"];

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);
            
            // Check if origin is in allowed list
            if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
                callback(null, true);
            } else {
                // For development, allow any localhost
                if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            }
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
});

// Store user socket connections
const userSockets = new Map();

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Handle user authentication and room joining
    socket.on("join_user_room", async (userId) => {
        if (!userId) {
            socket.emit("error", { message: "User ID required" });
            return;
        }

        // Store user socket connection
        userSockets.set(userId, socket.id);
        socket.userId = userId;

        // Join user's personal room
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their room`);

        // Notify others that this user is online
        try {
            io.emit("user_online", { userId });
        } catch (e) {
            console.warn("Failed to emit user_online", e);
        }

        // Send list of currently online users to the newly connected socket
        try {
            const onlineUsers = Array.from(userSockets.keys());
            socket.emit("online_users", { onlineUsers });
        } catch (e) {
            console.warn("Failed to send online_users", e);
        }

        socket.emit("connected", { userId, socketId: socket.id });
    });

    // Handle joining a conversation room
    socket.on("join_conversation", (conversationId) => {
        if (!conversationId) return;
        socket.join(`conversation_${conversationId}`);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle leaving a conversation room
    socket.on("leave_conversation", (conversationId) => {
        if (!conversationId) return;
        socket.leave(`conversation_${conversationId}`);
        console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Handle sending a message
    socket.on("send_message", async (messageData) => {
        try {
            const {
                conversationId,
                senderId,
                receiverId,
                content,
                type,
                fileUrl,
                fileName,
                fileSize,
                fileType,
            } = messageData;

            if (!conversationId || !senderId || !receiverId) {
                socket.emit("message_error", {
                    tempId: messageData.tempId,
                    message: "Missing required fields",
                });
                return;
            }

            // Ensure conversation exists
            const conversation = await prisma.conversation.upsert({
                where: {
                    user1Id_user2Id: {
                        user1Id: Math.min(senderId, receiverId),
                        user2Id: Math.max(senderId, receiverId),
                    },
                },
                update: {
                    lastMessageAt: new Date(),
                },
                create: {
                    user1Id: Math.min(senderId, receiverId),
                    user2Id: Math.max(senderId, receiverId),
                    lastMessageAt: new Date(),
                },
            });

            // Create message in database
            const message = await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: senderId,
                    receiverId: receiverId,
                    content: content || null,
                    type: type || "text",
                    fileUrl: fileUrl || null,
                    fileName: fileName || null,
                    fileSize: fileSize || null,
                    fileType: fileType || null,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            fullName: true,
                            profilePicture: true,
                        },
                    },
                    receiver: {
                        select: {
                            id: true,
                            fullName: true,
                            profilePicture: true,
                        },
                    },
                },
            });

            // Emit to sender (confirmation)
            socket.emit("message_sent", {
                ...message,
                tempId: messageData.tempId,
            });

            // Emit to receiver (new message)
            const receiverSocketId = userSockets.get(receiverId);
            if (receiverSocketId) {
                io.to(`user_${receiverId}`).emit("new_message", message);
            }

            // Also emit to conversation room
            io.to(`conversation_${conversation.id}`).emit("new_message", message);
        } catch (error) {
            console.error("Error handling send_message:", error);
            socket.emit("message_error", {
                tempId: messageData.tempId,
                message: error.message,
            });
        }
    });

    // Handle typing indicator
    socket.on("typing", ({ conversationId, userId, isTyping }) => {
        socket.to(`conversation_${conversationId}`).emit("user_typing", {
            userId,
            isTyping,
        });
    });

    // Handle message read status
    socket.on("mark_read", async ({ conversationId, userId }) => {
        try {
            await prisma.message.updateMany({
                where: {
                    conversationId: conversationId,
                    receiverId: userId,
                    read: false,
                },
                data: {
                    read: true,
                    readAt: new Date(),
                },
            });

            // Notify other users in conversation
            socket.to(`conversation_${conversationId}`).emit("messages_read", {
                conversationId,
                userId,
            });
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        if (socket.userId) {
            userSockets.delete(socket.userId);
            // Notify others that this user went offline
            try {
                io.emit("user_offline", { userId: socket.userId });
            } catch (e) {
                console.warn("Failed to emit user_offline", e);
            }
        }
    });

    // Handle broadcasting new message from API route
    socket.on("broadcast_new_message", (data) => {
        try {
            const { message, conversationId, receiverId } = data;
            
            if (!message || !conversationId) {
                console.error("Invalid broadcast_new_message data");
                return;
            }

            // Emit to conversation room
            io.to(`conversation_${conversationId}`).emit("new_message", message);
            
            // Emit to receiver's user room
            if (receiverId) {
                io.to(`user_${receiverId}`).emit("new_message", message);
            }
            
            console.log(`Broadcasted new message to conversation ${conversationId}`);
        } catch (error) {
            console.error("Error broadcasting new message:", error);
        }
    });

    // Handle marking messages as read from API route
    socket.on("broadcast_messages_read", (data) => {
        try {
            const { conversationId, userId } = data;
            
            if (!conversationId || !userId) {
                console.error("Invalid broadcast_messages_read data");
                return;
            }

            // Notify other users in conversation
            io.to(`conversation_${conversationId}`).emit("messages_read", {
                conversationId,
                userId,
            });
            
            console.log(`Broadcasted messages read for conversation ${conversationId}`);
        } catch (error) {
            console.error("Error broadcasting messages read:", error);
        }
    });
});

// Start server
// Render provides PORT environment variable, fallback to SOCKET_PORT or 3001
const PORT = process.env.PORT || process.env.SOCKET_PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Socket.IO server running on port ${PORT}`);
    console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
    console.log("SIGTERM received, closing server...");
    server.close(() => {
        console.log("Server closed");
        prisma.$disconnect();
        process.exit(0);
    });
});

