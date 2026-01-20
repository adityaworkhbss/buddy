export const CLIENT_JWT_KEY = "client_jwt";

export function setClientToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token === null) {
      localStorage.removeItem(CLIENT_JWT_KEY);
    } else {
      localStorage.setItem(CLIENT_JWT_KEY, token);
    }
  } catch (e) {
    console.error("setClientToken error:", e);
  }
}

export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CLIENT_JWT_KEY);
  } catch (e) {
    console.error("getClientToken error:", e);
    return null;
  }
}

export function clearClientToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CLIENT_JWT_KEY);
  } catch (e) {
    console.error("clearClientToken error:", e);
  }
}

function base64UrlDecode(str: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    // replace URL-safe chars
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    // pad
    const pad = base64.length % 4;
    const padded = base64 + (pad ? "=".repeat(4 - pad) : "");
    const decoded = atob(padded);
    return decodeURIComponent(
      decoded
        .split("")
        .map((c) => {
          const code = c.charCodeAt(0).toString(16).padStart(2, "0");
          return "%" + code;
        })
        .join("")
    );
  } catch (e) {
    return null;
  }
}

export function parseJwt(token: string | null): Record<string, any> | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = base64UrlDecode(parts[1]);
  if (!payload) return null;
  try {
    return JSON.parse(payload) as Record<string, any>;
  } catch (e) {
    return null;
  }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = parseJwt(token);
  if (!payload) return true;
  const exp = payload.exp;
  if (!exp) return true;
  try {
    const now = Math.floor(Date.now() / 1000);
    return now >= Number(exp);
  } catch (e) {
    return true;
  }
}
