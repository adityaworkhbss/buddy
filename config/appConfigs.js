export const APP_CONFIG = {
    OTP_EXPIRY_MINUTES: 1,
    suggestionFromMapbox: true, // Enable/disable Mapbox address suggestions for location fields
    // Cloudinary is configured via environment variables:
    // CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
    // Storage provider: "cloudinary" (default) or "s3" (if you want to use AWS S3)
    STORAGE_PROVIDER: "cloudinary"
};