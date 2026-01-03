import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(req) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                uid: user.uid,
                phone: user.phone,
                fullName: user.fullName,
                profilePicture: user.profilePicture,
            }
        });
    } catch (error) {
        console.error("Error getting current user:", error);
        return NextResponse.json(
            { success: false, message: "Failed to get current user" },
            { status: 500 }
        );
    }
}

