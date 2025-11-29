import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { APP_CONFIG } from "../../../../config/appConfigs";
import { getSession } from "../../../../lib/otpSessionStore";

export async function POST(req) {
    try {
        const { phone, newPassword, sessionId, otp } = await req.json();

        if (!phone || !newPassword) {
            return NextResponse.json(
                { success: false, message: "Phone number and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, message: "Password must be at least 6 characters long" },
                { status: 400 }
            );
        }

        let formattedPhone = phone.trim();
        formattedPhone = formattedPhone.replace(/^\+91/, "").replace(/^91/, "");
        formattedPhone = formattedPhone.replace(/\D/g, "");
        
        if (formattedPhone.length !== 10) {
            return NextResponse.json(
                { success: false, message: "Invalid phone number format" },
                { status: 400 }
            );
        }
        
        formattedPhone = `+91${formattedPhone}`;

        // Find user by phone
        const user = await prisma.user.findUnique({
            where: { phone: formattedPhone },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Phone number not registered" },
                { status: 404 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (err) {
        console.error("Error resetting password:", err);
        return NextResponse.json(
            { success: false, message: err.message || "Failed to reset password" },
            { status: 500 }
        );
    }
}

