import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSession, deleteSession } from "../../../../lib/otpSessionStore";
import { APP_CONFIG } from "../../../../config/appConfigs";

export async function POST(req) {
    try {
        const { userId, newPhone, sessionId, otp } = await req.json();

        if (!userId || !newPhone || !sessionId || !otp) {
            return NextResponse.json(
                { success: false, message: "User ID, new phone number, session ID, and OTP are required" },
                { status: 400 }
            );
        }

        // Step 1: Verify OTP
        const session = await getSession(String(sessionId));

        if (!session) {
            return NextResponse.json(
                { success: false, message: "Invalid or expired session. Please request a new OTP." },
                { status: 400 }
            );
        }

        // Check if session has expired
        const now = Date.now();
        const minutesElapsed = (now - session.createdAt) / 60000;
        
        if (minutesElapsed > APP_CONFIG.OTP_EXPIRY_MINUTES) {
            await deleteSession(String(sessionId));
            return NextResponse.json(
                { success: false, message: `OTP has expired. Please request a new OTP.` },
                { status: 400 }
            );
        }

        // Verify the OTP
        if (session.otp !== otp) {
            return NextResponse.json(
                { success: false, message: "Invalid OTP. Please check and try again." },
                { status: 400 }
            );
        }

        // Verify that the OTP was sent to the new phone number
        const normalizedNewPhone = newPhone.replace(/[\s\-\(\)]/g, "");
        const phoneWithPlus = normalizedNewPhone.startsWith("+") ? normalizedNewPhone : `+${normalizedNewPhone}`;
        const expectedPhone = phoneWithPlus.startsWith("whatsapp:") ? phoneWithPlus : `whatsapp:${phoneWithPlus}`;

        if (session.phone !== expectedPhone) {
            return NextResponse.json(
                { success: false, message: "OTP was not sent to this phone number. Please verify the correct number." },
                { status: 400 }
            );
        }

        // Step 2: Check if new phone number is already in use
        const existingUser = await prisma.user.findUnique({
            where: { phone: phoneWithPlus },
        });

        if (existingUser && existingUser.id !== parseInt(userId)) {
            await deleteSession(String(sessionId));
            return NextResponse.json(
                { success: false, message: "This phone number is already registered to another account." },
                { status: 400 }
            );
        }

        // Step 3: Update user's phone number
        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { phone: phoneWithPlus },
        });

        // Step 4: Delete the OTP session
        await deleteSession(String(sessionId));

        return NextResponse.json({
            success: true,
            message: "Phone number updated successfully",
            phone: phoneWithPlus
        });
    } catch (error) {
        console.error("Error changing phone number:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to change phone number. Please try again." },
            { status: 500 }
        );
    }
}

