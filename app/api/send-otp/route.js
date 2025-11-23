import { adminAuth } from "../../../lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: "Phone number required" }, { status: 400 });
        }

        const sessionInfo = await adminAuth.createSessionCookie(phone, { expiresIn: 5 * 60 * 1000 });

        return NextResponse.json({ sessionInfo });
    } catch (error) {
        console.error("send-otp error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
