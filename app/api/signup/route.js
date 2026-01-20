import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { createSession, setSessionCookie } from "../../../lib/session";
import { signToken } from "../../../lib/jwt";

export async function POST(req) {
    try {
        const { phone, password } = await req.json();

        // Validate input
        if (!phone || !password) {
            return NextResponse.json(
                { success: false, message: "Phone number and password are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { phone },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Phone number already registered" },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: "Password must be at least 6 characters long" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate unique UID (using timestamp and phone number)
        const uid = `user_${Date.now()}_${phone.replace(/\D/g, "")}`;
        
        // Create user in database
        // userId (id) is automatically generated as primary key
        const user = await prisma.user.create({
            data: {
                uid,
                phone,
                password: hashedPassword,
            },
        });

        console.log("User created successfully:", { userId: user.id, phone: user.phone });

        // Create session for the new user
        const session = await createSession(user.id);
        
        // Sign client JWT
        const tokenPayload = { sub: user.id, uid: user.uid };
        const clientJwt = signToken(tokenPayload, { expiresIn: process.env.JWT_CLIENT_EXPIRES_IN || "1h" });

        // Create response
        const response = NextResponse.json({
            success: true,
            message: "User created successfully",
            user: {
                userId: user.id, // Primary key - required
                uid: user.uid,
                phone: user.phone,
            },
            token: clientJwt,
        });

        // Set session cookie
        setSessionCookie(response, session.sessionToken, session.expiresAt);

        return response;
    } catch (err) {
        console.error("Error creating user:", err);
        
        // Handle Prisma unique constraint errors
        if (err.code === "P2002") {
            return NextResponse.json(
                { success: false, message: "Phone number already registered" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: err.message || "Failed to create user" },
            { status: 500 }
        );
    }
}
