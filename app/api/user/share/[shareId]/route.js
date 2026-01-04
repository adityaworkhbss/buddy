import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get user profile by share ID (public endpoint)
export async function GET(req, { params }) {
    try {
        // In Next.js 16.0.3, params is an object, not a Promise
        let shareId = params?.shareId;
        
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
            console.error("Share ID missing. Params:", params, "URL:", req.url);
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

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Profile not found" },
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
        return NextResponse.json(
            { success: false, message: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

