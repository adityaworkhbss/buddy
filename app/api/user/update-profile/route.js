import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req) {
    try {
        const formData = await req.formData();

        const phone = formData.get("phone");
        if (!phone) {
            return NextResponse.json(
                { success: false, message: "Phone number is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        if (!user.id) {
            return NextResponse.json(
                { success: false, message: "Invalid user - userId is missing" },
                { status: 500 }
            );
        }

        const personalInfoJson = formData.get("personalInfo");
        const housingDetailsJson = formData.get("housingDetails");
        
        const personalInfo = personalInfoJson ? JSON.parse(personalInfoJson) : {};
        const housingDetails = housingDetailsJson ? JSON.parse(housingDetailsJson) : {};

        if (personalInfo.password) {
            const hashedPassword = await bcrypt.hash(personalInfo.password, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            });
        }

        const userUpdateData = {};
        if (personalInfo.name) userUpdateData.fullName = personalInfo.name;
        if (personalInfo.age) userUpdateData.age = parseInt(personalInfo.age);
        if (personalInfo.gender) userUpdateData.gender = personalInfo.gender;
        if (personalInfo.profilePicture) userUpdateData.profilePicture = personalInfo.profilePicture;
        if (personalInfo.whatsappIsPrimary !== undefined) userUpdateData.isWhatsappNumber = personalInfo.whatsappIsPrimary;
        if (personalInfo.lifestyle?.smoking) userUpdateData.smoking = personalInfo.lifestyle.smoking;
        if (personalInfo.lifestyle?.drinking) userUpdateData.drinking = personalInfo.lifestyle.drinking;
        if (personalInfo.lifestyle?.diet) userUpdateData.diet = personalInfo.lifestyle.diet;
        if (personalInfo.lifestyle?.sleep) userUpdateData.sleepSchedule = personalInfo.lifestyle.sleep;

        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: user.id },
                data: userUpdateData,
            });
        }

        if (personalInfo.jobExperiences && Array.isArray(personalInfo.jobExperiences)) {
            await prisma.workExperience.deleteMany({
                where: { userId: user.id },
            });

            for (const exp of personalInfo.jobExperiences) {
                if (exp.company || exp.position) {
                    await prisma.workExperience.create({
                        data: {
                            userId: user.id,
                            experienceTitle: exp.position || exp.company || "",
                            company: exp.company || "",
                            position: exp.position || "",
                            from: exp.fromYear ? new Date(`${exp.fromYear}-01-01`) : null,
                            till: exp.currentlyWorking ? null : (exp.tillYear ? new Date(`${exp.tillYear}-01-01`) : null),
                            stillWorking: exp.currentlyWorking || false,
                        },
                    });
                }
            }
        }

        if (personalInfo.educationExperiences && Array.isArray(personalInfo.educationExperiences)) {
            await prisma.education.deleteMany({
                where: { userId: user.id },
            });

            for (const edu of personalInfo.educationExperiences) {
                if (edu.institution || edu.degree) {
                    const stillStudying = edu.stillStudying !== undefined 
                        ? edu.stillStudying 
                        : (!edu.endYear || edu.endYear === "");
                    
                    await prisma.education.create({
                        data: {
                            userId: user.id,
                            educationTitle: edu.degree || edu.institution || "",
                            institution: edu.institution || "",
                            degree: edu.degree || "",
                            from: edu.startYear ? new Date(`${edu.startYear}-01-01`) : null,
                            till: stillStudying ? null : (edu.endYear ? new Date(`${edu.endYear}-01-01`) : null),
                            stillStudying: stillStudying,
                        },
                    });
                }
            }
        }

        if (housingDetails) {
            let photosVideos = [];
            if (housingDetails.flatDetails?.media) {
                photosVideos = housingDetails.flatDetails.media.map(m => {
                    if (typeof m === 'string') return m;
                    if (m.url) return m.url;
                    if (m.file) return null;
                    return m;
                }).filter(Boolean);
            }

            // Extract lat/long from locationCoords array [lng, lat]
            const latitude = housingDetails.locationCoords?.[1] ? parseFloat(housingDetails.locationCoords[1]) : null;
            const longitude = housingDetails.locationCoords?.[0] ? parseFloat(housingDetails.locationCoords[0]) : null;

            console.log("Received locationCoords:", housingDetails.locationCoords);
            console.log("Extracted latitude:", latitude, "longitude:", longitude);

            const housingData = {
                userId: user.id,
                lookingFor: housingDetails.searchType || null,
                budgetMin: housingDetails.budget?.[0] ? parseInt(housingDetails.budget[0]) : null,
                budgetMax: housingDetails.budget?.[1] ? parseInt(housingDetails.budget[1]) : null,
                movingDate: housingDetails.movingDate ? new Date(housingDetails.movingDate) : null,
                preferenceLocation: housingDetails.location || null,
                searchRadius: housingDetails.radius ? parseInt(housingDetails.radius) : null,
                latitude: latitude,
                longitude: longitude,
                roomType: housingDetails.roomType || null,
                preferredAmenities: Array.isArray(housingDetails.amenityPreferences) ? housingDetails.amenityPreferences : [],
                address: housingDetails.flatDetails?.address || null,
                roomsAvailable: housingDetails.flatDetails?.roomsAvailable ? parseInt(housingDetails.flatDetails.roomsAvailable) : null,
                totalRooms: housingDetails.flatDetails?.totalRooms ? parseInt(housingDetails.flatDetails.totalRooms) : null,
                rentPerRoom: housingDetails.flatDetails?.rent ? parseInt(String(housingDetails.flatDetails.rent).replace(/\D/g, '')) : null,
                availableFrom: housingDetails.flatDetails?.availableFrom ? new Date(housingDetails.flatDetails.availableFrom) : null,
                deposit: housingDetails.flatDetails?.deposit ? parseFloat(String(housingDetails.flatDetails.deposit).replace(/[^\d.]/g, '')) : null,
                availableAmenities: Array.isArray(housingDetails.flatDetails?.amenities) ? housingDetails.flatDetails.amenities : [],
                description: housingDetails.flatDetails?.description || null,
                photosVideos: photosVideos,
            };

            console.log("Saving housing data to DB:", JSON.stringify({ ...housingData, photosVideos: photosVideos.length + " items" }, null, 2));

            await prisma.housingDetails.upsert({
                where: { userId: user.id },
                update: housingData,
                create: housingData,
            });
        }

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
            userId: user.id,
        });
    } catch (err) {
        console.error("Error updating profile:", err);
        return NextResponse.json(
            { success: false, message: err.message || "Failed to update profile" },
            { status: 500 }
        );
    }
}

