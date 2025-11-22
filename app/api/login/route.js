import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminAuth } from "../../../lib/firebaseAdmin";
import { prisma } from "../../../lib/prisma";

export async function POST(req) {
    try {
        const { phone, password } = await req.json();

        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            console.error("User does not exist");
            return NextResponse.json(
                { error: "Phone number not registered" },
                { status: 400 }
            );
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 }
            );
        }

        const firebaseToken = await adminAuth.createCustomToken(user.uid);

        return NextResponse.json({
            firebaseToken,
        });
    } catch (err) {
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}
