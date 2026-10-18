import mongoose from "mongoose";
import { logger } from "../utils/logger";
import fs from "node:fs";
import path from "node:path";

/**
 * Sanitizes MongoDB connection URI to mask sensitive credentials (username/password)
 * before logging to stdout/stderr.
 */
export const sanitizeUri = (uri: string): string => {
  return uri.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/g, "mongodb$1://***:***@");
};

/**
 * Sanitizes error messages to ensure database credentials are never leaked in error logs.
 */
export const sanitizeMessage = (message: string, rawUri?: string): string => {
  let cleaned = message;
  if (rawUri) {
    cleaned = cleaned.replace(rawUri, sanitizeUri(rawUri));
  }
  return sanitizeUri(cleaned);
};

/**
 * Loads environment variables from .env.local or .env if MONGODB_URI is not set.
 */
const loadEnvIfMissing = (): void => {
  if (!process.env.MONGODB_URI) {
    for (const envFile of [".env.local", ".env"]) {
      const envPath = path.resolve(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        try {
          process.loadEnvFile(envPath);
          if (process.env.MONGODB_URI) break;
        } catch {
          // Ignore and check next file
        }
      }
    }
  }
};

let listenersAttached = false;

const setupConnectionListeners = (): void => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB Mongoose connection established successfully.");
  });

  mongoose.connection.on("error", (err) => {
    const rawMsg = err.message || String(err);
    logger.error("MongoDB connection runtime error:", sanitizeMessage(rawMsg, process.env.MONGODB_URI));
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB connection disconnected.");
  });
};

/**
 * Connects to MongoDB using MONGODB_URI from environment variables.
 * Throws an error if connection fails or MONGODB_URI is missing.
 */
export const connectDatabase = async (): Promise<typeof mongoose> => {
  loadEnvIfMissing();

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    const errorMsg = "MONGODB_URI environment variable is not defined. Server database connection aborted.";
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  const maskedUri = sanitizeUri(mongoUri);
  logger.info(`Attempting MongoDB connection to ${maskedUri}`);

  setupConnectionListeners();

  try {
    const conn = await mongoose.connect(mongoUri);
    return conn;
  } catch (error: any) {
    const rawMsg = error.message || String(error);
    logger.error(`Failed to connect to MongoDB (${maskedUri}):`, sanitizeMessage(rawMsg, mongoUri));
    throw new Error(`Database connection failed: ${sanitizeMessage(rawMsg, mongoUri)}`);
  }
};

/**
 * Gracefully closes the MongoDB Mongoose connection.
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed gracefully.");
  }
};

/**
 * Checks if the MongoDB connection is currently active (readyState === 1).
 */
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

