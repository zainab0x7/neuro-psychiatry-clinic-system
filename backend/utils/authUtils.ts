import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { UserRole } from "../../models/User";

const getSecretKey = (): Uint8Array => {
  const isProd = process.env.NODE_ENV === "production";
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;

  if (isProd && (!secret || secret.includes("your-32-character") || secret.includes("secure_jwt"))) {
    throw new Error(
      "FATAL SECURITY ERROR: In production mode (NODE_ENV=production), a unique SESSION_SECRET or JWT_SECRET must be supplied via environment variables."
    );
  }

  const activeSecret = secret || "psychiatrist_system_secure_jwt_session_secret_32chars_min";
  return new TextEncoder().encode(activeSecret);
};

export interface TokenPayload {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  [key: string]: unknown;
}

/**
 * Generates a signed JWT token valid for 24 hours (or specified duration)
 */
export const generateToken = async (payload: TokenPayload, expiresIn: string = "24h"): Promise<string> => {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
};

/**
 * Verifies a JWT token signature and returns the payload if valid
 */
export const verifyToken = async (token: string): Promise<TokenPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Hashes a plain text password using bcryptjs
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Verifies a plain text password against a stored bcrypt hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
