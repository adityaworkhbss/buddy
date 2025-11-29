import { NextResponse } from "next/server";
import twilio from "twilio";
import { APP_CONFIG } from "../../../config/appConfigs";
import {
    cleanupExpiredSessions,
    createSession,
    checkRateLimit,
    getSessions
} from "../../../lib/otpSessionStore";

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json(
                { success: false, message: "Phone number is required" },
                { status: 400 }
            );
        }

        const normalizedPhone = phone.replace(/[\s\-\(\)]/g, "");

        let whatsappTo;
        if (normalizedPhone.startsWith("whatsapp:")) {
            whatsappTo = normalizedPhone;
        } else {
            const cleanPhone = normalizedPhone.replace(/^whatsapp:/, "");
            const phoneWithPlus = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;
            whatsappTo = `whatsapp:${phoneWithPlus}`;
        }

        // Step 1: Check rate limit before sending OTP
        const rateLimitCheck = await checkRateLimit(whatsappTo);
        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: rateLimitCheck.reason || "Too many OTP requests. Please try again later.",
                    retryAfter: rateLimitCheck.retryAfter
                },
                { status: 429 } // 429 Too Many Requests
            );
        }

        // Step 2: Clean up expired sessions (async, don't wait)
        cleanupExpiredSessions(APP_CONFIG.OTP_EXPIRY_MINUTES).catch(err => {
            console.error("Error cleaning expired sessions:", err);
        });

        // Step 3: Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Step 4: Send OTP via Twilio
        let from = process.env.TWILIO_WHATSAPP_FROM;
        if (!from.startsWith("whatsapp:")) {
            from = from.startsWith("+") ? `whatsapp:${from}` : `whatsapp:+${from}`;
        }

        const message = await client.messages.create({
            from: from,
            to: whatsappTo,
            body: `Your OTP code is: ${otp}. This code will expire in ${APP_CONFIG.OTP_EXPIRY_MINUTES} minute(s).`
        });

        console.log("OTP sent via WhatsApp:", otp, "to", whatsappTo);
        console.log("Twilio Message SID:", message.sid);

        // Step 5: Create new OTP session (this also deletes old sessions in a transaction)
        const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await createSession(sessionId, otp, whatsappTo);

        const sessions = await getSessions();
        console.log("New OTP session created. SessionId:", sessionId, "Phone:", whatsappTo, "Expires in:", APP_CONFIG.OTP_EXPIRY_MINUTES, "minutes");
        console.log("Total active sessions:", Object.keys(sessions).length);


        return NextResponse.json({
            success: true,
            sessionId: String(sessionId),
            message: "OTP sent successfully"
        });
    } catch (error) {
        console.error("Error sending OTP via WhatsApp:", error);

        // Handle specific Twilio errors
        if (error.code === 21211) {
            return NextResponse.json(
                { success: false, message: "Invalid phone number format" },
                { status: 400 }
            );
        }

        if (error.code === 21608) {
            return NextResponse.json(
                { success: false, message: "Phone number not registered with Twilio Sandbox. Please join the sandbox first." },
                { status: 400 }
            );
        }

        if (error.code === 21614 || error.message?.includes("same channel")) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Channel mismatch error. Please ensure TWILIO_WHATSAPP_FROM is set correctly in your environment variables.",
                    error: process.env.NODE_ENV === "development" ? error.message : undefined
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Failed to send OTP. Please try again later.",
                error: process.env.NODE_ENV === "development" ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
