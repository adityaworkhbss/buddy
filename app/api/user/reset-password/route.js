import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { APP_CONFIG } from "../../../../config/appConfigs";
import { getSession } from "../../../../lib/otpSessionStore";

export async function POST(req) {
    try {
        const { phone, newPassword, sessionId, otp } = await req.json();

        console.log(`${phone} ${newPassword} ${sessionId}`);

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
        
        // Remove whatsapp: prefix if present
        formattedPhone = formattedPhone.replace(/^whatsapp:/i, "");
        
        // Remove +91 or 91 prefix
        formattedPhone = formattedPhone.replace(/^\+91/, "").replace(/^91/, "");
        
        // Remove all non-digits
        formattedPhone = formattedPhone.replace(/\D/g, "");
        
        if (formattedPhone.length !== 10) {
            console.error("Invalid phone format. Received:", phone, "Formatted:", formattedPhone);
            return NextResponse.json(
                { success: false, message: "Invalid phone number format" },
                { status: 400 }
            );
        }
        
        formattedPhone = `+91${formattedPhone}`;

        console.log("Looking for user with phone:", formattedPhone);

        // Find user by phone
        const user = await prisma.user.findUnique({
            where: { phone: formattedPhone },
        });
        
        if (!user) {
            console.error("User not found with phone:", formattedPhone);
            return NextResponse.json(
                { success: false, message: "Phone number not registered" },
                { status: 404 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        try {

            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            });
            
            console.log("Password updated successfully for user:", user.id);
        } catch (updateError) {
            console.error("Error updating password in database:", updateError);
            throw updateError;
        }

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

