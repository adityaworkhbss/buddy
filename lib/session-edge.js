/**
 * Edge-compatible session utilities
 * These functions work in Edge Runtime (middleware) and don't use Prisma
 */

/**
 * Get a session by token (Edge-compatible version)
 * This is a lightweight version that only checks the cookie, not the database
 * For full validation, use the API routes which run in Node.js runtime
 * @param {string} sessionToken - The session token
 * @returns {Promise<Object|null>} Basic session info or null
 */
export async function getSessionEdge(sessionToken) {
    // In Edge Runtime, we can't access Prisma
    // So we just validate the token format and return a basic object
    // Full validation happens in API routes
    if (!sessionToken || sessionToken.length < 32) {
        return null;
    }
    
    // Return a basic session object
    // The actual validation will happen in the API routes
    return {
        sessionToken,
        valid: true
    };
}

