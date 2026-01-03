import { getSessionTokenFromCookie, getSession } from "./session";

/**
 * Get the current authenticated user from the request
 * @param {Request} request - The Next.js request object
 * @returns {Promise<Object|null>} The user object or null if not authenticated
 */
export async function getCurrentUser(request) {
    try {
        const sessionToken = getSessionTokenFromCookie(request);
        
        if (!sessionToken) {
            return null;
        }

        const session = await getSession(sessionToken);
        
        if (!session) {
            return null;
        }

        return session.user;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

/**
 * Check if a user is authenticated
 * @param {Request} request - The Next.js request object
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated(request) {
    const user = await getCurrentUser(request);
    return user !== null;
}

