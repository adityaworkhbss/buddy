import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET(req) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const filters = await prisma.userFilter.findUnique({
            where: { userId: user.id },
        });

        return NextResponse.json({
            success: true,
            filters: filters || null,
        });
    } catch (error) {
        console.error("Error getting filters:", error);
        return NextResponse.json(
            { success: false, message: "Failed to get filters" },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();

        // Helper function to convert empty string to null
        const nullIfEmpty = (value) => (value === "" || value === undefined ? null : value);
        const nullIfEmptyArray = (value) => (Array.isArray(value) && value.length === 0 ? [] : (value || []));

        // Prepare filter data
        const filterData = {
            searchRadius: body.searchRadius !== undefined && body.searchRadius !== null ? parseInt(body.searchRadius) : null,
            filterLocationName: nullIfEmpty(body.filterLocationName),
            filterLatitude: body.filterLatitude !== undefined && body.filterLatitude !== null ? parseFloat(body.filterLatitude) : null,
            filterLongitude: body.filterLongitude !== undefined && body.filterLongitude !== null ? parseFloat(body.filterLongitude) : null,
            flatmateAgeRange: nullIfEmptyArray(body.flatmateAgeRange),
            flatmateHabits: nullIfEmptyArray(body.flatmateHabits),
            flatmateMoveInDate: body.flatmateMoveInDate ? new Date(body.flatmateMoveInDate) : null,
            locationSearch: nullIfEmpty(body.locationSearch),
            locationCoords: body.locationCoords || null,
            priceRange: nullIfEmptyArray(body.priceRange),
            flatType: nullIfEmpty(body.flatType),
            roomType: nullIfEmpty(body.roomType),
            availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
            brokerage: nullIfEmpty(body.brokerage),
            securityDeposit: nullIfEmpty(body.securityDeposit),
            roomAmenities: nullIfEmptyArray(body.roomAmenities),
            commonAreaAmenities: nullIfEmptyArray(body.commonAreaAmenities),
        };

        // Upsert filter (create or update)
        const filters = await prisma.userFilter.upsert({
            where: { userId: user.id },
            update: filterData,
            create: {
                userId: user.id,
                ...filterData,
            },
        });

        return NextResponse.json({
            success: true,
            filters,
        });
    } catch (error) {
        console.error("Error saving filters:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            meta: error.meta,
        });
        return NextResponse.json(
            { 
                success: false, 
                message: error.message || "Failed to save filters",
                code: error.code,
            },
            { status: 500 }
        );
    }
}
