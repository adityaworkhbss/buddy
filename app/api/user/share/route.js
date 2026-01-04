import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";
import { randomBytes } from "crypto";

// POST - Generate or regenerate share ID for current user
export async function POST(req) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Generate a unique share ID (base64url encoded random bytes)
        let shareId;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            shareId = randomBytes(16).toString("base64url");
            
            // Check if this shareId already exists
            const existing = await prisma.user.findUnique({
                where: { shareId },
            });

            if (!existing) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return NextResponse.json(
                { success: false, message: "Failed to generate unique share ID" },
                { status: 500 }
            );
        }

        // Update user with share ID
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { shareId },
            select: {
                id: true,
                shareId: true,
            },
        });

        return NextResponse.json({
            success: true,
            shareId: updatedUser.shareId,
            shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/profile/${updatedUser.shareId}`,
        });
    } catch (error) {
        console.error("Error generating share ID:", error);
        return NextResponse.json(
            { success: false, message: "Failed to generate share ID" },
            { status: 500 }
        );
    }
}

// GET - Get share ID for current user or specified user
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const targetUserId = searchParams.get("userId");
        
        // If userId is provided, we need to check if current user is authorized
        // For now, allow getting share ID for any user (can be restricted later)
        let userId;
        
        if (targetUserId) {
            userId = parseInt(targetUserId);
        } else {
            // Get current user if no userId specified
            const user = await getCurrentUser(req);
            if (!user) {
                return NextResponse.json(
                    { success: false, message: "Unauthorized" },
                    { status: 401 }
                );
            }
            userId = user.id;
        }

        // Get user with share ID
        const userWithShare = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                shareId: true,
            },
        });

        if (!userWithShare) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // If shareId doesn't exist, generate one
        let shareId = userWithShare.shareId;
        if (!shareId) {
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!isUnique && attempts < maxAttempts) {
                shareId = randomBytes(16).toString("base64url");
                
                const existing = await prisma.user.findUnique({
                    where: { shareId },
                });

                if (!existing) {
                    isUnique = true;
                }
                attempts++;
            }

            if (!isUnique) {
                return NextResponse.json(
                    { success: false, message: "Failed to generate unique share ID" },
                    { status: 500 }
                );
            }

            // Update user with share ID
            await prisma.user.update({
                where: { id: userId },
                data: { shareId },
            });
        }

        return NextResponse.json({
            success: true,
            shareId: shareId,
            shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/profile/${shareId}`,
        });
    } catch (error) {
        console.error("Error getting share ID:", error);
        return NextResponse.json(
            { success: false, message: "Failed to get share ID" },
            { status: 500 }
        );
    }
}

