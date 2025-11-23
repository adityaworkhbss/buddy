import { NextResponse } from "next/server";
import { sessionsStore } from "../send-otp/route";
import { APP_CONFIG } from "../../../config/appConfigs";

export async function POST(req) {
    const { sessionId, otp } = await req.json();

    const session = sessionsStore[sessionId];

    if (!session)
        return NextResponse.json({ success: false, message: "Invalid session" });

    const now = Date.now();
    if ((now - session.createdAt) / 60000 > APP_CONFIG.OTP_EXPIRY_MINUTES) {
        return NextResponse.json({ success: false, message: "OTP expired" });
    }

    if (session.otp !== otp) {
        return NextResponse.json({ success: false, message: "Incorrect OTP" });
    }

    delete sessionsStore[sessionId];

    return NextResponse.json({ success: true });
}
