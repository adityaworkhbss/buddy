import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to convert file to base64
const fileToBase64 = async (file) => {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    return buffer.toString("base64");
};

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

        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.warn("Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.");
            return NextResponse.json(
                { success: false, message: "Cloudinary is not configured. Please contact administrator." },
                { status: 500 }
            );
        }

        // Determine resource type (image or video)
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        const resourceType = isVideo ? "video" : "image";

        // Convert file to base64
        const base64File = await fileToBase64(file);
        const dataUri = `data:${file.type};base64,${base64File}`;

        // Generate unique public ID
        const fileExtension = file.name.split(".").pop();
        const publicId = `${type}/${uuidv4()}`;

        // Upload options
        const uploadOptions = {
            public_id: publicId,
            resource_type: resourceType,
            folder: type, // Organize files by type (profile, media, etc.)
            overwrite: false,
            invalidate: true, // Invalidate CDN cache
        };

        // Add transformation options for images
        if (isImage) {
            uploadOptions.format = fileExtension;
            uploadOptions.quality = "auto"; // Auto optimize quality
            uploadOptions.fetch_format = "auto"; // Auto format (webp when supported)
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(dataUri, uploadOptions);

        return NextResponse.json({
            success: true,
            url: uploadResult.secure_url, // Use secure HTTPS URL
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            resourceType: uploadResult.resource_type,
            width: uploadResult.width,
            height: uploadResult.height,
            bytes: uploadResult.bytes,
            message: "File uploaded successfully to Cloudinary",
        });
    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to upload file" },
            { status: 500 }
        );
    }
}

