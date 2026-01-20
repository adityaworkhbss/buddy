import { NextResponse } from "next/server";

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = [
        "/login", 
        "/signup", 
        "/profile", // Allow public profile pages (e.g. /profile and /profile/:id)
        "/api/user/share", // Allow public profile share API
        "/api/login",
        "/api/signup",
        "/api/send-otp", 
        "/api/verify-otp", 
        "/api/logout",
        "/api/user/reset-password"  // Allow password reset without authentication
    ];
    
    // Check if the route is public (exact match or starts with)
    const isPublicRoute = publicRoutes.some(route => {
        const matches = pathname === route || pathname.startsWith(route + "/") || pathname.startsWith(route);
        if (matches && pathname.includes("reset-password")) {
            console.log("Reset password route matched as public:", pathname);
        }
        return matches;
    });

    // Allow public routes
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Check authentication for protected routes
    // In Edge Runtime, we can't use Prisma, so we just check if the cookie exists
    // Full session validation happens in API routes which run in Node.js runtime
    const sessionToken = request.cookies.get("session_token")?.value;
    
    if (!sessionToken) {
        // Redirect to login if not authenticated
        if (pathname.startsWith("/api")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Basic token format validation (Edge-compatible)
    // Full validation with database check happens in API routes
    if (sessionToken.length < 32) {
        if (pathname.startsWith("/api")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("session_token");
        return response;
    }

    // User appears to have a valid session token
    // Full validation happens in protected API routes
    return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
