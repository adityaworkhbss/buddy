import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminAuth } from "../../../lib/firebaseAdmin";
import { prisma } from "../../../lib/prisma";

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
        // This UID will be used for Firebase custom token generation
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

        return NextResponse.json({
            success: true,
            message: "User created successfully",
            user: {
                userId: user.id, // Primary key - required
                uid: user.uid,
                phone: user.phone,
            },
        });
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

