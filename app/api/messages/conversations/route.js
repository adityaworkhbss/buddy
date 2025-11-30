import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// GET - Fetch all conversations for a user
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID is required" },
                { status: 400 }
            );
        }

        const userIdInt = parseInt(userId);

        // Find all conversations where user is either user1 or user2
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { user1Id: userIdInt },
                    { user2Id: userIdInt },
                ],
            },
            include: {
                user1: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePicture: true,
                    },
                },
                user2: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePicture: true,
                    },
                },
                messages: {
                    take: 1,
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
            orderBy: {
                lastMessageAt: "desc",
            },
        });

        // Format conversations with other user info and unread count
        const formattedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const otherUser = conv.user1Id === userIdInt ? conv.user2 : conv.user1;
                const lastMessage = conv.messages[0] || null;

                // Count unread messages
                const unreadCount = await prisma.message.count({
                    where: {
                        conversationId: conv.id,
                        receiverId: userIdInt,
                        read: false,
                    },
                });

                return {
                    id: conv.id,
                    otherUserId: otherUser.id,
                    otherUserName: otherUser.fullName || "Unknown User",
                    otherUserProfilePicture: otherUser.profilePicture,
                    lastMessage: lastMessage
                        ? {
                              content: lastMessage.content,
                              type: lastMessage.type,
                              createdAt: lastMessage.createdAt,
                          }
                        : null,
                    unreadCount: unreadCount,
                    lastMessageAt: conv.lastMessageAt,
                };
            })
        );

        return NextResponse.json({
            success: true,
            conversations: formattedConversations,
        });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch conversations" },
            { status: 500 }
        );
    }
}

