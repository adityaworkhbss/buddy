import { adminAuth } from "../../../lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { sessionInfo, otp } = await req.json();

        if (!sessionInfo || !otp) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Verify OTP (Admin SDK)
        const verification = await adminAuth.verifyIdToken(sessionInfo);

        // OTP is correct → Return Firebase UID
        return NextResponse.json({
            uid: verification.uid,
            phoneNumber: verification.phone_number,
        });
    } catch (error) {
        console.error("verify-otp error:", error);
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }
}
