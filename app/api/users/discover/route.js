import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function GET(req) {
    try {
        // Get current user
        const currentUser = await getCurrentUser(req);
        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        let latitude = parseFloat(searchParams.get("latitude"));
        let longitude = parseFloat(searchParams.get("longitude"));
        const radius = parseFloat(searchParams.get("radius")) || 10; // Default 10km
        const limit = parseInt(searchParams.get("limit")) || 3; // Default 3 users
        const offset = parseInt(searchParams.get("offset")) || 0; // For pagination
        const excludeIds = searchParams.get("excludeIds")?.split(",").map(id => parseInt(id)).filter(Boolean) || [];

        // Get current user's housing details to get their location if not provided
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
            const userHousing = await prisma.housingDetails.findUnique({
                where: { userId: currentUser.id },
                select: { latitude: true, longitude: true }
            });

            if (userHousing?.latitude && userHousing?.longitude) {
                latitude = userHousing.latitude;
                longitude = userHousing.longitude;
            } else {
                return NextResponse.json(
                    { success: false, message: "User location not found. Please update your profile location." },
                    { status: 400 }
                );
            }
        }

        // Validate coordinates
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
            return NextResponse.json(
                { success: false, message: "Valid latitude and longitude are required" },
                { status: 400 }
            );
        }

        // Get all users with housing details that have coordinates
        const allUsers = await prisma.user.findMany({
            where: {
                id: {
                    not: currentUser.id, // Exclude current user
                    notIn: excludeIds, // Exclude already shown users
                },
                housingDetails: {
                    latitude: { not: null },
                    longitude: { not: null },
                }
            },
            include: {
                housingDetails: true,
                workExperiences: {
                    orderBy: { from: "desc" }
                },
                educations: {
                    orderBy: { from: "desc" }
                }
            },
            take: 100, // Get more users to filter by distance
        });

        // Calculate distance for each user and filter by radius
        const usersWithDistance = allUsers
            .map(user => {
                if (!user.housingDetails?.latitude || !user.housingDetails?.longitude) {
                    return null;
                }

                const distance = calculateDistance(
                    latitude,
                    longitude,
                    user.housingDetails.latitude,
                    user.housingDetails.longitude
                );

                return {
                    ...user,
                    distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
                };
            })
            .filter(user => user !== null && user.distance <= radius)
            .sort((a, b) => a.distance - b.distance); // Sort by distance

        // Apply pagination
        const paginatedUsers = usersWithDistance.slice(offset, offset + limit);

        // Format response
        const formattedUsers = paginatedUsers.map(user => ({
            id: user.id.toString(),
            name: user.fullName || "Unknown",
            age: user.age || 0,
            gender: user.gender || "",
            phone: user.phone,
            profilePicture: user.profilePicture || "",
            city: user.housingDetails?.preferenceLocation?.split(",")[0]?.trim() || "",
            state: user.housingDetails?.preferenceLocation?.split(",")[1]?.trim() || "",
            distance: user.distance,
            searchType: user.housingDetails?.lookingFor === "flat" ? "flatmate" : "flat",
            myHabits: [
                user.smoking ? "Smoker" : "Non-Smoker",
                user.drinking ? "Drinker" : "Non-Drinker",
                user.diet === "vegetarian" ? "Vegetarian" : user.diet === "vegan" ? "Vegan" : null,
                user.sleepSchedule === "early" ? "Early Riser" : user.sleepSchedule === "late" ? "Night Owl" : null,
            ].filter(Boolean),
            lookingForHabits: [], // This would come from user preferences
            jobExperiences: user.workExperiences?.map(exp => ({
                id: exp.id.toString(),
                company: exp.company || "",
                position: exp.position || exp.experienceTitle || "",
                fromYear: exp.from ? new Date(exp.from).getFullYear().toString() : "",
                tillYear: exp.till ? new Date(exp.till).getFullYear().toString() : "",
                currentlyWorking: exp.stillWorking || false,
            })) || [],
            educationExperiences: user.educations?.map(edu => ({
                id: edu.id.toString(),
                institution: edu.institution || "",
                degree: edu.degree || edu.educationTitle || "",
                startYear: edu.from ? new Date(edu.from).getFullYear().toString() : "",
                endYear: edu.till ? new Date(edu.till).getFullYear().toString() : "",
            })) || [],
            flatDetails: user.housingDetails?.address ? {
                address: user.housingDetails.address,
                latitude: user.housingDetails.latitude,
                longitude: user.housingDetails.longitude,
                furnishingType: user.housingDetails.description?.toLowerCase().includes("furnished") ? "Furnished" : 
                                user.housingDetails.description?.toLowerCase().includes("semi") ? "Semi-Furnished" : 
                                user.housingDetails.description?.toLowerCase().includes("unfurnished") ? "Unfurnished" : "Furnished",
                description: user.housingDetails.description || "",
                commonAmenities: user.housingDetails.availableAmenities || [],
                commonPhotos: user.housingDetails.photosVideos?.filter(url => url && (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg'))) || [],
                rooms: user.housingDetails.roomsAvailable ? Array.from({ length: user.housingDetails.roomsAvailable }, (_, i) => ({
                    id: (i + 1).toString(),
                    type: user.housingDetails.roomType === "private" ? "Private Room" : 
                          user.housingDetails.roomType === "shared" ? "Shared Room" : 
                          user.housingDetails.roomType === "studio" ? "Studio" : "Private Room",
                    rent: `₹${parseInt(user.housingDetails.rentPerRoom || 0).toLocaleString()}/month`,
                    available: 1,
                    securityDeposit: `₹${parseInt(user.housingDetails.deposit || 0).toLocaleString()}`,
                    availableFrom: user.housingDetails.availableFrom ? new Date(user.housingDetails.availableFrom).toISOString() : new Date().toISOString(),
                    furnishingType: "Furnished",
                    amenities: user.housingDetails.availableAmenities || [],
                    photos: [],
                })) : [],
            } : null,
        }));

        return NextResponse.json({
            success: true,
            users: formattedUsers,
            total: usersWithDistance.length,
            hasMore: offset + limit < usersWithDistance.length,
        });
    } catch (error) {
        console.error("Error discovering users:", error);
        return NextResponse.json(
            { success: false, message: "Failed to discover users" },
            { status: 500 }
        );
    }
}

