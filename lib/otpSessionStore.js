/**
 * Shared OTP Session Store (Database-backed)
 * 
 * This module provides a centralized session store for OTP management
 * that can be used across multiple API routes. Sessions are stored in the database
 * and automatically expire after OTP_EXPIRY_MINUTES.
 * 
 * Features:
 * - Supports multiple concurrent users
 * - Rate limiting per phone number
 * - Database transactions for race condition prevention
 * - Automatic cleanup of expired sessions
 * 
 * Session Structure (Database):
 * {
 *   sessionId: string,        // Unique session ID (primary key)
 *   otp: string,              // The OTP code
 *   phone: string,            // Phone number (normalized format)
 *   timeOfCreation: DateTime  // Timestamp when session was created
 * }
 */

import { prisma } from "./prisma";

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
    MAX_REQUESTS_PER_PHONE: 5,        // Max OTP requests per phone in time window
    RATE_LIMIT_WINDOW_MINUTES: 15,    // Time window for rate limiting
    MIN_TIME_BETWEEN_REQUESTS_SECONDS: 30  // Minimum seconds between requests for same phone
};

/**
 * Check if Prisma client has the otpSession model
 * @returns {boolean} True if model exists
 */
function checkPrismaClient() {
    if (!prisma.otpSession) {
        console.error("ERROR: Prisma client does not have 'otpSession' model.");
        console.error("Please restart your development server to regenerate Prisma client.");
        console.error("Or run: npx prisma generate");
        return false;
    }
    return true;
}

/**
 * Get a specific session by sessionId
 * @param {string} sessionId - The session ID
 * @returns {Object|null} The session object or null if not found
 */
export async function getSession(sessionId) {
    try {
        if (!checkPrismaClient()) {
            throw new Error("Prisma client not properly initialized. Please restart the server.");
        }

        const session = await prisma.otpSession.findUnique({
            where: { sessionId: String(sessionId) }
        });
        
        if (!session) {
            return null;
        }
        
        // Convert to format expected by existing code
        return {
            otp: session.otp,
            createdAt: session.timeOfCreation.getTime(), // Convert to timestamp
            phone: session.phone
        };
    } catch (error) {
        console.error("Error getting OTP session:", error);
        return null;
    }
}

/**
 * Check rate limit for a phone number
 * @param {string} phone - Phone number (normalized format)
 * @returns {Object} { allowed: boolean, reason?: string, retryAfter?: number }
 */
export async function checkRateLimit(phone) {
    try {
        if (!checkPrismaClient()) {
            return { allowed: true }; // Allow if client not initialized
        }

        const now = new Date();
        const windowStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
        const minTimeBetween = new Date(now.getTime() - RATE_LIMIT_CONFIG.MIN_TIME_BETWEEN_REQUESTS_SECONDS * 1000);

        // Check recent requests count
        const recentSessions = await prisma.otpSession.findMany({
            where: {
                phone: String(phone),
                timeOfCreation: {
                    gte: windowStart
                }
            },
            orderBy: {
                timeOfCreation: 'desc'
            }
        });

        // Check if too many requests in time window
        if (recentSessions.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_PHONE) {
            const oldestSession = recentSessions[recentSessions.length - 1];
            const retryAfter = Math.ceil(
                (windowStart.getTime() + RATE_LIMIT_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000 - now.getTime()) / 1000
            );
            return {
                allowed: false,
                reason: `Too many OTP requests. Please try again after ${Math.ceil(retryAfter / 60)} minutes.`,
                retryAfter
            };
        }

        // Check minimum time between requests
        if (recentSessions.length > 0) {
            const lastSession = recentSessions[0];
            if (lastSession.timeOfCreation > minTimeBetween) {
                const retryAfter = Math.ceil(
                    (lastSession.timeOfCreation.getTime() + RATE_LIMIT_CONFIG.MIN_TIME_BETWEEN_REQUESTS_SECONDS * 1000 - now.getTime()) / 1000
                );
                return {
                    allowed: false,
                    reason: `Please wait ${retryAfter} seconds before requesting another OTP.`,
                    retryAfter
                };
            }
        }

        return { allowed: true };
    } catch (error) {
        console.error("Error checking rate limit:", error);
        // On error, allow the request (fail open)
        return { allowed: true };
    }
}

/**
 * Create a new OTP session with rate limiting and transaction safety
 * @param {string} sessionId - Unique session ID
 * @param {string} otp - The OTP code
 * @param {string} phone - Phone number (normalized format)
 * @returns {Object} The created session
 */
export async function createSession(sessionId, otp, phone) {
    try {
        if (!checkPrismaClient()) {
            throw new Error("Prisma client not properly initialized. Please restart the server.");
        }

        // Use transaction to ensure atomicity (prevents race conditions)
        const session = await prisma.$transaction(async (tx) => {
            // Delete old sessions for this phone first (within transaction)
            await tx.otpSession.deleteMany({
                where: { phone: String(phone) }
            });

            // Create new session
            return await tx.otpSession.create({
                data: {
                    sessionId: String(sessionId),
                    otp: String(otp),
                    phone: String(phone),
                    timeOfCreation: new Date()
                }
            });
        });
        
        return {
            otp: session.otp,
            createdAt: session.timeOfCreation.getTime(),
            phone: session.phone
        };
    } catch (error) {
        // Handle unique constraint violation (race condition)
        if (error.code === 'P2002') {
            console.error("Race condition detected: sessionId already exists, retrying...");
            // Retry with new sessionId
            const newSessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            return createSession(newSessionId, otp, phone);
        }
        
        console.error("Error creating OTP session:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            meta: error.meta
        });
        throw error;
    }
}

/**
 * Delete a session by sessionId
 * @param {string} sessionId - The session ID to delete
 * @returns {boolean} True if session was deleted, false if not found
 */
export async function deleteSession(sessionId) {
    try {
        if (!checkPrismaClient()) {
            throw new Error("Prisma client not properly initialized. Please restart the server.");
        }

        await prisma.otpSession.delete({
            where: { sessionId: String(sessionId) }
        });
        return true;
    } catch (error) {
        if (error.code === 'P2025') {
            // Record not found
            return false;
        }
        console.error("Error deleting OTP session:", error);
        return false;
    }
}

/**
 * Delete all sessions for a specific phone number
 * @param {string} phone - Phone number (normalized format)
 * @returns {number} Number of sessions deleted
 */
export async function deleteSessionsByPhone(phone) {
    try {
        if (!checkPrismaClient()) {
            throw new Error("Prisma client not properly initialized. Please restart the server.");
        }

        const result = await prisma.otpSession.deleteMany({
            where: { phone: String(phone) }
        });
        return result.count;
    } catch (error) {
        console.error("Error deleting OTP sessions by phone:", error);
        return 0;
    }
}

/**
 * Get rate limit configuration (for frontend display)
 * @returns {Object} Rate limit configuration
 */
export function getRateLimitConfig() {
    return {
        maxRequests: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_PHONE,
        windowMinutes: RATE_LIMIT_CONFIG.RATE_LIMIT_WINDOW_MINUTES,
        minTimeBetweenSeconds: RATE_LIMIT_CONFIG.MIN_TIME_BETWEEN_REQUESTS_SECONDS
    };
}

/**
 * Clean up expired sessions based on OTP_EXPIRY_MINUTES
 * @param {number} expiryMinutes - Number of minutes after which sessions expire
 * @returns {number} Number of expired sessions deleted
 */
export async function cleanupExpiredSessions(expiryMinutes) {
    try {
        if (!checkPrismaClient()) {
            // Don't throw here, just return 0 to allow the flow to continue
            console.error("Prisma client not initialized, skipping cleanup");
            return 0;
        }

        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() - expiryMinutes);
        
        const result = await prisma.otpSession.deleteMany({
            where: {
                timeOfCreation: {
                    lt: expiryTime
                }
            }
        });
        
        return result.count;
    } catch (error) {
        console.error("Error cleaning up expired OTP sessions:", error);
        return 0;
    }
}

/**
 * Get all session IDs (for debugging)
 * @returns {string[]} Array of session IDs
 */
export async function getAllSessionIds() {
    try {
        const sessions = await prisma.otpSession.findMany({
            select: { sessionId: true }
        });
        return sessions.map(s => s.sessionId);
    } catch (error) {
        console.error("Error getting all session IDs:", error);
        return [];
    }
}

/**
 * Get session count (for debugging)
 * @returns {number} Total number of active sessions
 */
export async function getSessionCount() {
    try {
        return await prisma.otpSession.count();
    } catch (error) {
        console.error("Error getting session count:", error);
        return 0;
    }
}

/**
 * Get all sessions (for internal use)
 * @returns {Object} The sessions object (for backward compatibility)
 */
export async function getSessions() {
    try {
        const sessions = await prisma.otpSession.findMany();
        const sessionsObj = {};
        
        sessions.forEach(session => {
            sessionsObj[session.sessionId] = {
                otp: session.otp,
                createdAt: session.timeOfCreation.getTime(),
                phone: session.phone
            };
        });
        
        return sessionsObj;
    } catch (error) {
        console.error("Error getting all sessions:", error);
        return {};
    }
}

