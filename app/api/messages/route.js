import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { broadcastNewMessage } from "../../../lib/socket-client";

// GET - Fetch messages for a conversation
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId");

        if (!conversationId) {
            return NextResponse.json(
                { success: false, message: "Conversation ID is required" },
                { status: 400 }
            );
        }

        const messages = await prisma.message.findMany({
            where: {
                conversationId: parseInt(conversationId),
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
            orderBy: {
                createdAt: "asc",
            },
        });

        return NextResponse.json({
            success: true,
            messages: messages,
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}

// POST - Create a new message
export async function POST(req) {
    try {
        const formData = await req.formData();

        const conversationId = formData.get("conversationId");
        const senderId = formData.get("senderId");
        const receiverId = formData.get("receiverId");
        const content = formData.get("content");
        const type = formData.get("type") || "text";
        const fileUrl = formData.get("fileUrl");
        const fileName = formData.get("fileName");
        const fileSize = formData.get("fileSize");
        const fileType = formData.get("fileType");

        if (!senderId || !receiverId) {
            return NextResponse.json(
                { success: false, message: "Sender ID and receiver ID are required" },
                { status: 400 }
            );
        }

        // Create or update conversation (conversationId is optional)
        let conversation;
        if (conversationId) {
            conversation = await prisma.conversation.findUnique({
                where: { id: parseInt(conversationId) },
            });
            if (!conversation) {
                return NextResponse.json(
                    { success: false, message: "Conversation not found" },
                    { status: 404 }
                );
            }
            // Update last message time
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() },
            });
        } else {
            // Create or get existing conversation
            conversation = await prisma.conversation.upsert({
                where: {
                    user1Id_user2Id: {
                        user1Id: Math.min(parseInt(senderId), parseInt(receiverId)),
                        user2Id: Math.max(parseInt(senderId), parseInt(receiverId)),
                    },
                },
                update: {
                    lastMessageAt: new Date(),
                },
                create: {
                    user1Id: Math.min(parseInt(senderId), parseInt(receiverId)),
                    user2Id: Math.max(parseInt(senderId), parseInt(receiverId)),
                    lastMessageAt: new Date(),
                },
            });
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: parseInt(senderId),
                receiverId: parseInt(receiverId),
                content: content || null,
                type: type,
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                fileSize: fileSize ? parseInt(fileSize) : null,
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

        // Emit socket event to notify users about the new message
        try {
            broadcastNewMessage(message, conversation.id, parseInt(receiverId));
        } catch (socketError) {
            // Don't fail the request if socket emission fails
            console.error("Error emitting socket event:", socketError);
        }

        return NextResponse.json({
            success: true,
            message: message,
        });
    } catch (error) {
        console.error("Error creating message:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create message" },
            { status: 500 }
        );
    }
}

// PUT - Mark messages as read
export async function PUT(req) {
    try {
        const { conversationId, userId } = await req.json();

        if (!conversationId || !userId) {
            return NextResponse.json(
                { success: false, message: "Conversation ID and user ID are required" },
                { status: 400 }
            );
        }

        const result = await prisma.message.updateMany({
            where: {
                conversationId: parseInt(conversationId),
                receiverId: parseInt(userId),
                read: false,
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });

        // Broadcast read status via socket
        try {
            const { broadcastMessagesRead } = await import("../../../lib/socket-client");
            broadcastMessagesRead(parseInt(conversationId), parseInt(userId));
        } catch (socketError) {
            // Don't fail the request if socket emission fails
            console.error("Error emitting socket event:", socketError);
        }

        return NextResponse.json({
            success: true,
            updatedCount: result.count,
        });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return NextResponse.json(
            { success: false, message: "Failed to mark messages as read" },
            { status: 500 }
        );
    }
}

