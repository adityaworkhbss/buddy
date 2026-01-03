import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { createSession, setSessionCookie } from "../../../lib/session";

export async function POST(req) {
    try {
        const { phone: inputPhone, password } = await req.json();

        // Validate input
        if (!inputPhone || !password) {
            return NextResponse.json(
                { error: "Phone number and password are required" },
                { status: 400 }
            );
        }

        // Automatically append +91 to phone number if not present
        let phone = inputPhone.trim();
        
        // Remove any existing country code
        phone = phone.replace(/^\+91/, "").replace(/^91/, "");
        
        // Remove any non-digit characters
        phone = phone.replace(/\D/g, "");
        
        // Validate phone number length (should be 10 digits)
        if (phone.length !== 10) {
            return NextResponse.json(
                { error: "Invalid phone number. Please enter a 10-digit number." },
                { status: 400 }
            );
        }
        
        // Add +91 prefix
        phone = `+91${phone}`;

        // Find user by phone number
        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Phone number not registered" },
                { status: 400 }
            );
        }

        // Verify password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 }
            );
        }

        // Create session
        const session = await createSession(user.id);
        
        // Create response
        const response = NextResponse.json({
            success: true,
            userId: user.id,
            uid: user.uid,
            phone: user.phone,
            message: "Login successful"
        });

        // Set session cookie
        setSessionCookie(response, session.sessionToken, session.expiresAt);

        return response;
    } catch (err) {
        console.error("Login error:", err);
        return NextResponse.json(
            { error: err.message || "Login failed. Please try again." },
            { status: 500 }
        );
    }
}
