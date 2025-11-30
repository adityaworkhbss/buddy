# Cloudinary Setup Guide

This application uses Cloudinary for image and video storage. Follow these steps to set up Cloudinary.

## 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account (or use an existing account)
3. Once logged in, you'll be taken to your dashboard

## 2. Get Your Cloudinary Credentials

From your Cloudinary dashboard:

1. Click on the **Dashboard** tab
2. You'll see your account details including:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

## 3. Set Environment Variables

Add the following environment variables to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Important:** Never commit your `.env.local` file to version control. The API Secret is sensitive and should be kept private.

## 4. Features

### Upload
- **Endpoint:** `POST /api/upload`
- **Body:** FormData with `file` and optional `type` (profile, media, etc.)
- **Response:** Returns secure URL, public ID, and metadata

### Retrieve
- **Endpoint:** `GET /api/media/[publicId]`
- **Query Parameters:**
  - `width`: Resize width
  - `height`: Resize height
  - `quality`: Image quality (auto, auto:best, auto:good, auto:eco, auto:low, or 1-100)
  - `format`: Output format (auto, webp, jpg, png, etc.)
  - `crop`: Crop mode (fill, scale, fit, etc.)
  - `resourceType`: image or video (default: auto-detect)

### Delete
- **Endpoint:** `DELETE /api/media/[publicId]`
- **Query Parameters:**
  - `resourceType`: image or video (default: image)

## 5. Usage Examples

### Upload an Image

```javascript
const formData = new FormData();
formData.append("file", file);
formData.append("type", "profile"); // Optional: profile, media, etc.

const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
});

const result = await response.json();
console.log(result.url); // Secure Cloudinary URL
```

### Get Image with Transformations

```javascript
// Get image with width 300px, auto quality, webp format
const url = `/api/media/${publicId}?width=300&quality=auto&format=webp`;

// Or use the helper function
import { getCloudinaryUrl } from "@/lib/cloudinary";
const url = getCloudinaryUrl(publicId, {
    width: 300,
    quality: "auto",
    format: "webp"
});
```

### Delete an Image

```javascript
const response = await fetch(`/api/media/${publicId}?resourceType=image`, {
    method: "DELETE",
});

const result = await response.json();
```

## 6. File Organization

Files are organized in Cloudinary folders based on the `type` parameter:
- `profile/` - Profile pictures
- `media/` - General media files
- Custom types - Any other type you specify

## 7. Automatic Optimizations

Cloudinary automatically:
- Optimizes image quality
- Converts to WebP when supported by the browser
- Provides responsive images
- Handles video transcoding
- Provides CDN delivery for fast loading

## 8. Free Tier Limits

The free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 25,000 monthly transformations

For production use, consider upgrading to a paid plan.

## 9. Security

- All URLs use HTTPS (secure URLs)
- API Secret is never exposed to the client
- Files are organized in folders for better management
- Public IDs are unique and non-guessable

## 10. Troubleshooting

### "Cloudinary is not configured" error
- Make sure all three environment variables are set
- Restart your development server after adding environment variables
- Check that variable names match exactly (case-sensitive)

### Upload fails
- Check file size limits (free tier: 10 MB for images, 100 MB for videos)
- Verify your API credentials are correct
- Check Cloudinary dashboard for any account issues

### Images not loading
- Verify the URL is using HTTPS
- Check that the public ID is correct
- Ensure the resource type matches (image vs video)

