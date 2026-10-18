import { Request, Response } from "express";
import { isDatabaseConnected } from "../config/database";

export const getHealthStatus = (_req: Request, res: Response): void => {
  const dbConnected = isDatabaseConnected();

  res.status(200).json({
    success: true,
    message: "Psychiatry EMR Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbConnected ? "connected" : "disconnected",
      ready: dbConnected,
    },
  });
};
