import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const type = formData.get("type") || "media";

        if (!file) {
            return NextResponse.json(
                { success: false, message: "No file provided" },
                { status: 400 }
            );
        }

        // If S3 is not configured, return a placeholder URL
        // In production, you should configure AWS S3
        if (!BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID) {
            console.warn("AWS S3 not configured. Using placeholder URL.");
            // Return a placeholder URL - in production, this should upload to S3
            const placeholderUrl = `/uploads/${type}/${uuidv4()}-${file.name}`;
            return NextResponse.json({
                success: true,
                url: placeholderUrl,
                message: "File upload placeholder (S3 not configured)",
            });
        }

        // Generate unique filename
        const fileExtension = file.name.split(".").pop();
        const fileName = `${type}/${uuidv4()}.${fileExtension}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
            ACL: "public-read", // Make file publicly accessible
        });

        await s3Client.send(command);

        // Construct public URL
        const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;

        return NextResponse.json({
            success: true,
            url: fileUrl,
            message: "File uploaded successfully",
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to upload file" },
            { status: 500 }
        );
    }
}

