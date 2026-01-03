import { prisma } from "./prisma";

const SESSION_DURATION_DAYS = 30;

/**
 * Generate a secure random session token
 * Uses Web Crypto API which works in both Node.js and Edge Runtime
 */
async function generateSessionToken() {
    // Use Web Crypto API for Edge Runtime compatibility
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for Node.js (shouldn't be needed but just in case)
    const { randomBytes } = await import("crypto");
    return randomBytes(32).toString("hex");
}

/**
 * Create a new session for a user
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} The created session
 */
export async function createSession(userId) {
    try {
        const sessionToken = await generateSessionToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

        // Delete any existing sessions for this user (optional: keep only one session per user)
        // await prisma.session.deleteMany({
        //     where: { userId }
        // });

        const session = await prisma.session.create({
            data: {
                sessionToken,
                userId,
                expiresAt,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        uid: true,
                        phone: true,
                        fullName: true,
                        profilePicture: true,
                    }
                }
            }
        });

        return {
            sessionToken: session.sessionToken,
            expiresAt: session.expiresAt,
            user: session.user
        };
    } catch (error) {
        console.error("Error creating session:", error);
        throw error;
    }
}

/**
 * Get a session by token
 * @param {string} sessionToken - The session token
 * @returns {Promise<Object|null>} The session with user data, or null if not found/expired
 */
export async function getSession(sessionToken) {
    try {
        if (!sessionToken) {
            return null;
        }

        const session = await prisma.session.findUnique({
            where: { sessionToken },
            include: {
                user: {
                    select: {
                        id: true,
                        uid: true,
                        phone: true,
                        fullName: true,
                        profilePicture: true,
                    }
                }
            }
        });

        if (!session) {
            return null;
        }

        // Check if session has expired
        if (session.expiresAt < new Date()) {
            // Delete expired session
            await deleteSession(sessionToken);
            return null;
        }

        return {
            sessionToken: session.sessionToken,
            expiresAt: session.expiresAt,
            user: session.user
        };
    } catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}

/**
 * Delete a session by token
 * @param {string} sessionToken - The session token
 * @returns {Promise<boolean>} True if session was deleted, false if not found
 */
export async function deleteSession(sessionToken) {
    try {
        if (!sessionToken) {
            return false;
        }

        const result = await prisma.session.deleteMany({
            where: { sessionToken }
        });

        return result.count > 0;
    } catch (error) {
        console.error("Error deleting session:", error);
        return false;
    }
}

/**
 * Delete all sessions for a user
 * @param {number} userId - The user ID
 * @returns {Promise<number>} Number of sessions deleted
 */
export async function deleteUserSessions(userId) {
    try {
        const result = await prisma.session.deleteMany({
            where: { userId }
        });

        return result.count;
    } catch (error) {
        console.error("Error deleting user sessions:", error);
        return 0;
    }
}

/**
 * Clean up expired sessions
 * @returns {Promise<number>} Number of expired sessions deleted
 */
export async function cleanupExpiredSessions() {
    try {
        const result = await prisma.session.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });

        return result.count;
    } catch (error) {
        console.error("Error cleaning up expired sessions:", error);
        return 0;
    }
}

/**
 * Get the session token from cookies
 * @param {Request} request - The Next.js request object
 * @returns {string|null} The session token or null
 */
export function getSessionTokenFromCookie(request) {
    if (!request || !request.cookies) {
        return null;
    }
    const cookies = request.cookies;
    return cookies.get("session_token")?.value || null;
}

/**
 * Set session cookie in response
 * @param {Response} response - The Next.js response object
 * @param {string} sessionToken - The session token
 * @param {Date} expiresAt - When the session expires
 */
export function setSessionCookie(response, sessionToken, expiresAt) {
    response.cookies.set("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });
}

/**
 * Clear session cookie
 * @param {Response} response - The Next.js response object
 */
export function clearSessionCookie(response) {
    response.cookies.delete("session_token");
}

