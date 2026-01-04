import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET - Get all saved profiles for current user
export async function GET(req) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if SavedProfile model exists
        if (typeof prisma.savedProfile === 'undefined' || prisma.savedProfile === null) {
            console.error("Prisma SavedProfile model not available. Please run 'npx prisma generate' and restart the server.");
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Database model not available. Please stop the server, run 'npx prisma generate', and restart the server.",
                },
                { status: 500 }
            );
        }

        // Get all saved profiles
        const savedProfiles = await prisma.savedProfile.findMany({
            where: {
                userId: user.id,
            },
            include: {
                savedUser: {
                    include: {
                        workExperiences: {
                            orderBy: { from: "desc" },
                        },
                        educations: {
                            orderBy: { from: "desc" },
                        },
                        housingDetails: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Format the response
        const formattedProfiles = savedProfiles.map((saved) => {
            const profile = saved.savedUser;
            return {
                id: profile.id.toString(),
                name: profile.fullName || "Unknown User",
                age: profile.age?.toString() || "",
                gender: profile.gender || "",
                profilePicture: profile.profilePicture || "",
                city: profile.housingDetails?.preferenceLocation?.split(",")[0]?.trim() || "",
                state: profile.housingDetails?.preferenceLocation?.split(",")[1]?.trim() || "",
                searchType: profile.housingDetails?.lookingFor === "flat" ? "flatmate" : "flat",
                myHabits: [
                    profile.smoking,
                    profile.drinking,
                    profile.diet,
                    profile.sleepSchedule,
                ].filter(Boolean),
                jobExperiences: profile.workExperiences.map((exp) => ({
                    id: exp.id.toString(),
                    company: exp.company || "",
                    position: exp.position || exp.experienceTitle || "",
                    fromYear: exp.from ? new Date(exp.from).getFullYear().toString() : "",
                    tillYear: exp.till ? new Date(exp.till).getFullYear().toString() : "",
                    currentlyWorking: exp.stillWorking,
                })),
                educationExperiences: profile.educations.map((edu) => ({
                    id: edu.id.toString(),
                    institution: edu.institution || "",
                    degree: edu.degree || edu.educationTitle || "",
                    startYear: edu.from ? new Date(edu.from).getFullYear().toString() : "",
                    endYear: edu.till ? new Date(edu.till).getFullYear().toString() : "",
                })),
                flatDetails: profile.housingDetails?.address ? {
                    address: profile.housingDetails.address,
                    furnishing: "Furnished",
                    description: profile.housingDetails.description || "",
                    commonAmenities: profile.housingDetails.availableAmenities || [],
                    rooms: [],
                } : undefined,
                savedAt: saved.createdAt,
            };
        });

        return NextResponse.json({
            success: true,
            profiles: formattedProfiles,
        });
    } catch (error) {
        console.error("Error fetching saved profiles:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch saved profiles" },
            { status: 500 }
        );
    }
}

// POST - Save a profile
export async function POST(req) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { savedUserId } = await req.json();

        if (!savedUserId) {
            return NextResponse.json(
                { success: false, message: "Saved user ID is required" },
                { status: 400 }
            );
        }

        const savedUserIdInt = parseInt(savedUserId);

        if (savedUserIdInt === user.id) {
            return NextResponse.json(
                { success: false, message: "Cannot save your own profile" },
                { status: 400 }
            );
        }

        // Check if SavedProfile model exists in Prisma client
        if (typeof prisma.savedProfile === 'undefined' || prisma.savedProfile === null) {
            console.error("Prisma SavedProfile model not available. Please run 'npx prisma generate' and restart the server.");
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Database model not available. Please stop the server, run 'npx prisma generate', and restart the server.",
                },
                { status: 500 }
            );
        }

        // Check if already saved
        let existing;
        try {
            existing = await prisma.savedProfile.findUnique({
                where: {
                    userId_savedUserId: {
                        userId: user.id,
                        savedUserId: savedUserIdInt,
                    },
                },
            });
        } catch (prismaError) {
            // If SavedProfile model doesn't exist, Prisma will throw an error
            if (prismaError.message && (
                prismaError.message.includes("savedProfile") || 
                prismaError.message.includes("Unknown arg") ||
                prismaError.code === "P2001"
            )) {
                console.error("Prisma SavedProfile model not found. Error:", prismaError.message);
                return NextResponse.json(
                    { 
                        success: false, 
                        message: "Database model not available. Please stop the server, run 'npx prisma generate', and restart the server.",
                        error: process.env.NODE_ENV === "development" ? prismaError.message : undefined,
                    },
                    { status: 500 }
                );
            }
            throw prismaError;
        }

        if (existing) {
            return NextResponse.json({
                success: true,
                message: "Profile already saved",
                saved: true,
            });
        }

        // Verify the user to be saved exists
        const userToSave = await prisma.user.findUnique({
            where: { id: savedUserIdInt },
        });

        if (!userToSave) {
            return NextResponse.json(
                { success: false, message: "User to save not found" },
                { status: 404 }
            );
        }

        // Save the profile
        const savedProfile = await prisma.savedProfile.create({
            data: {
                userId: user.id,
                savedUserId: savedUserIdInt,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Profile saved successfully",
            saved: true,
            id: savedProfile.id,
        });
    } catch (error) {
        console.error("Error saving profile:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            meta: error.meta,
        });
        return NextResponse.json(
            { 
                success: false, 
                message: error.message || "Failed to save profile",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// DELETE - Unsave a profile
export async function DELETE(req) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const savedUserId = searchParams.get("savedUserId");

        if (!savedUserId) {
            return NextResponse.json(
                { success: false, message: "Saved user ID is required" },
                { status: 400 }
            );
        }

        const savedUserIdInt = parseInt(savedUserId);

        // Check if SavedProfile model exists
        if (!prisma.savedProfile || typeof prisma.savedProfile.deleteMany !== 'function') {
            console.error("Prisma SavedProfile model not available. Please run 'npx prisma generate' and restart the server.");
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Database model not available. Please stop the server, run 'npx prisma generate', and restart the server.",
                },
                { status: 500 }
            );
        }

        // Delete the saved profile
        await prisma.savedProfile.deleteMany({
            where: {
                userId: user.id,
                savedUserId: savedUserIdInt,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Profile removed from saved",
            saved: false,
        });
    } catch (error) {
        console.error("Error unsaving profile:", error);
        return NextResponse.json(
            { success: false, message: "Failed to remove saved profile" },
            { status: 500 }
        );
    }
}

