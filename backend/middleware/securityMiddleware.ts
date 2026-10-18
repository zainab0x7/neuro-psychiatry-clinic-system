import { Request, Response, NextFunction } from "express";

/**
 * Applies security headers to HTTP responses (similar to Helmet).
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
  );
  next();
};

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Creates an in-memory sliding-window rate limiter middleware.
 * Zero external dependencies, self-hosted, safe for clinic operation.
 */
export const createRateLimiter = (options: RateLimiterOptions) => {
  const { windowMs, max, message = "Too many requests. Please try again later." } = options;
  const hits = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically (every 5 minutes)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, bypass rate limiting unless testing rate limit explicitly
    if (process.env.NODE_ENV === "test" && !req.headers["x-test-ratelimit"]) {
      next();
      return;
    }

    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1")
      .toString()
      .split(",")[0]
      .trim();

    const now = Date.now();
    let record = hits.get(ip);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", resetSeconds.toString());

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds.toString());
      res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: resetSeconds,
      });
      return;
    }

    next();
  };
};

/**
 * Strict rate limiter for authentication endpoints (Login, Password Reset)
 * Allows max 10 attempts per 15 minutes per IP.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Account access throttled for 15 minutes to prevent brute-force attacks.",
});

/**
 * Throttling for sensitive admin & backup operations
 * Allows max 30 operations per 15 minutes per IP.
 */
export const adminRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Administrative request quota exceeded. Please wait before retrying.",
});

/**
 * General API rate limiter for standard operational endpoints
 * Allows max 300 requests per 1 minute per IP.
 */
export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: "API request threshold reached. Please reduce request frequency.",
});
