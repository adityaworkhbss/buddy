import { NextResponse } from "next/server";
import { deleteSession } from "../../../lib/session";

export async function POST(req) {
    try {
        const sessionToken = req.cookies.get("session_token")?.value;

        if (sessionToken) {
            await deleteSession(sessionToken);
        }

        const response = NextResponse.json({
            success: true,
            message: "Logged out successfully"
        });

        // Clear session cookie
        response.cookies.delete("session_token");

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to logout" },
            { status: 500 }
        );
    }
}

