import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_in_prod";
const JWT_EXPIRES_IN_SECONDS = parseInt(process.env.JWT_EXPIRES_IN_SECONDS || "3600", 10); // 1 hour default

/**
 * Sign a payload into a JWT
 * @param {Object} payload
 * @param {Object} [options]
 * @returns {string}
 */
export function signToken(payload, options = {}) {
  const opts = { expiresIn: options.expiresIn || JWT_EXPIRES_IN_SECONDS };
  return jwt.sign(payload, JWT_SECRET, opts);
}

/**
 * Verify a JWT and return the decoded payload or null
 * @param {string} token
 * @returns {Object|null}
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
