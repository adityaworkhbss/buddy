import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/media/[publicId]
 * Retrieve image or video from Cloudinary with optional transformations
 * 
 * Query parameters:
 * - width: Resize width
 * - height: Resize height
 * - quality: Image quality (auto, auto:best, auto:good, auto:eco, auto:low, or 1-100)
 * - format: Output format (auto, webp, jpg, png, etc.)
 * - crop: Crop mode (fill, scale, fit, etc.)
 * - resourceType: image or video (default: auto-detect)
 */
export async function GET(req, { params }) {
    try {
        const { publicId } = params;
        const { searchParams } = new URL(req.url);

        if (!publicId) {
            return NextResponse.json(
                { success: false, message: "Public ID is required" },
                { status: 400 }
            );
        }

        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return NextResponse.json(
                { success: false, message: "Cloudinary is not configured" },
                { status: 500 }
            );
        }

        // Get transformation parameters
        const width = searchParams.get("width");
        const height = searchParams.get("height");
        const quality = searchParams.get("quality") || "auto";
        const format = searchParams.get("format") || "auto";
        const crop = searchParams.get("crop") || "fill";
        const resourceType = searchParams.get("resourceType") || "auto";

        // Build transformation options
        const transformations = {};
        if (width) transformations.width = parseInt(width);
        if (height) transformations.height = parseInt(height);
        if (quality) transformations.quality = quality;
        if (format && format !== "auto") transformations.fetch_format = format;
        if (crop) transformations.crop = crop;

        // Generate Cloudinary URL with transformations
        const url = cloudinary.url(publicId, {
            resource_type: resourceType === "auto" ? undefined : resourceType,
            secure: true,
            ...transformations,
        });

        // Return the URL (or you could proxy the image/video)
        return NextResponse.json({
            success: true,
            url: url,
            publicId: publicId,
            transformations: Object.keys(transformations).length > 0 ? transformations : null,
        });
    } catch (error) {
        console.error("Error retrieving media from Cloudinary:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to retrieve media" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/media/[publicId]
 * Delete image or video from Cloudinary
 */
export async function DELETE(req, { params }) {
    try {
        const { publicId } = params;
        const { searchParams } = new URL(req.url);
        const resourceType = searchParams.get("resourceType") || "image";

        if (!publicId) {
            return NextResponse.json(
                { success: false, message: "Public ID is required" },
                { status: 400 }
            );
        }

        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return NextResponse.json(
                { success: false, message: "Cloudinary is not configured" },
                { status: 500 }
            );
        }

        // Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });

        if (result.result === "ok" || result.result === "not found") {
            return NextResponse.json({
                success: true,
                message: "Media deleted successfully",
                result: result.result,
            });
        } else {
            return NextResponse.json(
                { success: false, message: "Failed to delete media" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error deleting media from Cloudinary:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to delete media" },
            { status: 500 }
        );
    }
}

