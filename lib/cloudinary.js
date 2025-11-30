import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generate a Cloudinary URL with transformations
 * @param {string} publicId - The public ID of the image/video
 * @param {object} options - Transformation options
 * @returns {string} - The Cloudinary URL
 */
export function getCloudinaryUrl(publicId, options = {}) {
    if (!publicId) return null;

    const {
        width,
        height,
        quality = "auto",
        format = "auto",
        crop = "fill",
        resourceType = "auto",
        ...otherOptions
    } = options;

    const transformations = {};
    if (width) transformations.width = width;
    if (height) transformations.height = height;
    if (quality) transformations.quality = quality;
    if (format && format !== "auto") transformations.fetch_format = format;
    if (crop) transformations.crop = crop;

    return cloudinary.url(publicId, {
        resource_type: resourceType === "auto" ? undefined : resourceType,
        secure: true,
        ...transformations,
        ...otherOptions,
    });
}

/**
 * Upload file to Cloudinary
 * @param {Buffer|string} file - File buffer or data URI
 * @param {object} options - Upload options
 * @returns {Promise} - Upload result
 */
export async function uploadToCloudinary(file, options = {}) {
    const {
        folder = "media",
        resourceType = "auto",
        publicId,
        ...otherOptions
    } = options;

    const uploadOptions = {
        folder,
        resource_type: resourceType === "auto" ? undefined : resourceType,
        overwrite: false,
        invalidate: true,
        ...otherOptions,
    };

    if (publicId) {
        uploadOptions.public_id = publicId;
    }

    return await cloudinary.uploader.upload(file, uploadOptions);
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Resource type (image, video, raw)
 * @returns {Promise} - Deletion result
 */
export async function deleteFromCloudinary(publicId, resourceType = "image") {
    return await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
    });
}

export default cloudinary;

