import { NextResponse } from "next/server";
import { APP_CONFIG } from "../../../config/appConfigs";
import {
    cleanupExpiredSessions,
    getSession,
    deleteSession,
    getAllSessionIds
} from "../../../lib/otpSessionStore";

export async function POST(req) {
    try {
        const { sessionId, otp } = await req.json();

        if (!sessionId || !otp) {
            return NextResponse.json(
                { success: false, message: "Session ID and OTP are required" },
                { status: 400 }
            );
        }

        // Step 1: Clean up expired sessions first
        const expiredCount = await cleanupExpiredSessions(APP_CONFIG.OTP_EXPIRY_MINUTES);
        if (expiredCount > 0) {
            console.log(`Cleaned up ${expiredCount} expired OTP session(s)`);
        }

        const sessionIdStr = String(sessionId);

        // Step 2: Search for the OTP session
        const session = await getSession(sessionIdStr);

        if (!session) {
            console.log("OTP session not found for sessionId:", sessionIdStr);
            const availableSessions = await getAllSessionIds();
            console.log("Available sessions:", availableSessions);
            return NextResponse.json(
                { success: false, message: "Invalid or expired session. Please request a new OTP." },
                { status: 400 }
            );
        }

        console.log("OTP session found:", { 
            sessionId: sessionIdStr, 
            phone: session.phone,
            createdAt: new Date(session.createdAt).toISOString() 
        });

        // Step 3: Check if session has expired
        const now = Date.now();
        const minutesElapsed = (now - session.createdAt) / 60000;
        
        if (minutesElapsed > APP_CONFIG.OTP_EXPIRY_MINUTES) {
            await deleteSession(sessionIdStr);
            console.log("OTP session expired and deleted:", sessionIdStr, `(${minutesElapsed.toFixed(2)} minutes elapsed)`);
            return NextResponse.json(
                { success: false, message: `OTP has expired. OTPs are valid for ${APP_CONFIG.OTP_EXPIRY_MINUTES} minutes only. Please request a new OTP.` },
                { status: 400 }
            );
        }

        // Step 4: Verify the OTP
        if (session.otp !== otp) {
            const timeRemaining = (APP_CONFIG.OTP_EXPIRY_MINUTES - minutesElapsed).toFixed(2);
            console.log("OTP mismatch. Expected:", session.otp, "Got:", otp);
            console.log("Session preserved for retry. Time remaining:", timeRemaining, "minutes");
            return NextResponse.json(
                { success: false, message: "Invalid OTP. Please check and try again." },
                { status: 400 }
            );
        }

        // Step 5: OTP verified successfully - delete the session
        await deleteSession(sessionIdStr);
        console.log("OTP verified successfully. Session deleted:", sessionIdStr);

        return NextResponse.json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return NextResponse.json(
            { success: false, message: "An error occurred while verifying OTP. Please try again." },
            { status: 500 }
        );
    }
}
