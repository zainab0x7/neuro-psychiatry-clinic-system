import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog";
import { POST, GET } from "../app/api/audit-logs/route";

async function testAuditRoute() {
  let mongoServer;
  try {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();

    const { dbConnect } = await import("../lib/dbConnect");
    await dbConnect();
    
    // Ensure indexes are built in Mongoose
    await AuditLog.syncIndexes();

    console.log("Testing POST /api/audit-logs with indexes synced...");

    // Test 1: First POST request with body containing id: "LOG-9006"
    const body1 = {
      id: "LOG-9006",
      timestamp: "2026-10-01 12:00:00",
      userId: "USR-001",
      userName: "Dr. Vance",
      userRole: "DOCTOR",
      action: "LOGIN",
      module: "AUTH",
      description: "User logged in",
    };

    const req1 = new Request("http://localhost:3000/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body1),
    });

    const res1 = await POST(req1);
    const json1 = await res1.json();
    console.log("Res 1 status:", res1.status, json1);

    // Test 2: Second POST request with SAME id: "LOG-9006" (e.g. from frontend)
    const req2 = new Request("http://localhost:3000/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body1),
    });

    const res2 = await POST(req2);
    const json2 = await res2.json();
    console.log("Res 2 status (duplicate id):", res2.status, json2);

  } catch (err) {
    console.error("Error running test:", err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

testAuditRoute();
