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
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
        }
    });
});

// Start server
const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
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

