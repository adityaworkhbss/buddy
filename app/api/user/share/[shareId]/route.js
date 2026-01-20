import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get user profile by share ID (public endpoint)
export async function GET(req, { params }) {
    try {
        // `params` may be a Promise in newer Next.js. Await into a local variable so we can safely access properties.
        const resolvedParams = await params;
        let shareId = resolvedParams?.shareId;

        // Fallback: extract from URL if params is not available
        if (!shareId) {
            const url = new URL(req.url);
            const pathParts = url.pathname.split('/');
            const shareIdIndex = pathParts.indexOf('share');
            if (shareIdIndex !== -1 && pathParts[shareIdIndex + 1]) {
                shareId = pathParts[shareIdIndex + 1];
            }
        }

        if (!shareId) {
            console.error("Share ID missing. Params:", resolvedParams, "URL:", req.url);
            return NextResponse.json(
                { success: false, message: "Share ID is required" },
                { status: 400 }
            );
        }

        console.log("Fetching profile for shareId:", shareId);

        // Find user by share ID
        const user = await prisma.user.findUnique({
            where: { shareId },
            include: {
                workExperiences: {
                    orderBy: {
                        from: "desc",
                    },
                },
                educations: {
                    orderBy: {
                        from: "desc",
                    },
                },
                housingDetails: true,
            },
        });

        console.log("DB lookup result for shareId", shareId, user ? "FOUND" : "NOT FOUND");

        if (!user) {
            // Ensure a clear JSON body is always returned for not-found
            return NextResponse.json(
                { success: false, message: "Profile not found", shareId },
                { status: 404 }
            );
        }

        // Format the response (exclude sensitive data like password, phone)
        const profileData = {
            id: user.id,
            fullName: user.fullName,
            age: user.age,
            gender: user.gender,
            profilePicture: user.profilePicture,
            smoking: user.smoking,
            drinking: user.drinking,
            diet: user.diet,
            sleepSchedule: user.sleepSchedule,
            workExperiences: user.workExperiences.map((exp) => ({
                id: exp.id,
                company: exp.company,
                position: exp.position || exp.experienceTitle,
                from: exp.from,
                till: exp.till,
                stillWorking: exp.stillWorking,
            })),
            educations: user.educations.map((edu) => ({
                id: edu.id,
                institution: edu.institution,
                degree: edu.degree || edu.educationTitle,
                from: edu.from,
                till: edu.till,
                stillStudying: edu.stillStudying,
            })),
            housingDetails: user.housingDetails
                ? {
                    lookingFor: user.housingDetails.lookingFor,
                    budgetMin: user.housingDetails.budgetMin,
                    budgetMax: user.housingDetails.budgetMax,
                    movingDate: user.housingDetails.movingDate,
                    preferenceLocation: user.housingDetails.preferenceLocation,
                    latitude: user.housingDetails.latitude,
                    longitude: user.housingDetails.longitude,
                    searchRadius: user.housingDetails.searchRadius,
                    roomType: user.housingDetails.roomType,
                    preferredAmenities: user.housingDetails.preferredAmenities,
                    address: user.housingDetails.address,
                    roomsAvailable: user.housingDetails.roomsAvailable,
                    totalRooms: user.housingDetails.totalRooms,
                    rentPerRoom: user.housingDetails.rentPerRoom,
                    availableFrom: user.housingDetails.availableFrom,
                    deposit: user.housingDetails.deposit,
                    availableAmenities: user.housingDetails.availableAmenities,
                    description: user.housingDetails.description,
                    photosVideos: user.housingDetails.photosVideos,
                }
                : null,
            createdAt: user.createdAt,
        };

        return NextResponse.json({
            success: true,
            profile: profileData,
        });
    } catch (error) {
        console.error("Error fetching profile by share ID:", error);
        // Return an explicit JSON error body so callers see a helpful payload instead of an empty object
        return NextResponse.json(
            { success: false, message: "Failed to fetch profile", error: String(error) },
            { status: 500 }
        );
    }
}
