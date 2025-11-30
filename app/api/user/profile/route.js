import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// GET - Fetch user profile data
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const phone = searchParams.get("phone");

        if (!userId && !phone) {
            return NextResponse.json(
                { success: false, message: "User ID or phone number is required" },
                { status: 400 }
            );
        }

        // Find user by ID or phone
        const where = userId ? { id: parseInt(userId) } : { phone };

        const user = await prisma.user.findUnique({
            where,
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
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Format the response (exclude sensitive data)
        const profileData = {
            id: user.id,
            uid: user.uid,
            phone: user.phone,
            fullName: user.fullName,
            age: user.age,
            gender: user.gender,
            profilePicture: user.profilePicture,
            isWhatsappNumber: user.isWhatsappNumber,
            smoking: user.smoking,
            drinking: user.drinking,
            diet: user.diet,
            sleepSchedule: user.sleepSchedule,
            workExperiences: user.workExperiences.map((exp) => ({
                id: exp.id,
                company: exp.company,
                position: exp.position,
                experienceTitle: exp.experienceTitle,
                from: exp.from,
                till: exp.till,
                stillWorking: exp.stillWorking,
            })),
            educations: user.educations.map((edu) => ({
                id: edu.id,
                institution: edu.institution,
                degree: edu.degree,
                educationTitle: edu.educationTitle,
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
            updatedAt: user.updatedAt,
        };

        return NextResponse.json({
            success: true,
            profile: profileData,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

