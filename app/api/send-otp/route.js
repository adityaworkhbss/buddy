import { NextResponse } from "next/server";

const sessions = {};

export async function POST(req) {
    const { phone } = await req.json();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("📩 CUSTOM OTP SENT:", otp, "to", phone);

    const sessionId = Date.now().toString();
    sessions[sessionId] = {
        otp,
        createdAt: Date.now()
    };

    return NextResponse.json({ sessionId });
}

export const sessionsStore = sessions;
