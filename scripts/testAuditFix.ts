import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog";
import { SignJWT } from "jose";

const SESSION_SECRET = process.env.SESSION_SECRET || 'psychiatrist_system_secure_jwt_session_secret_32chars_min';
const SECRET_KEY = new TextEncoder().encode(SESSION_SECRET);

async function signToken(payload: Record<string, any>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(SECRET_KEY);
}

async function runAuditFixTest() {
  let mongoServer;
  try {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();

    const { dbConnect } = await import("../lib/dbConnect");
    await dbConnect();
    await AuditLog.syncIndexes();

    const { POST, GET } = await import("../app/api/audit-logs/route");

    console.log("===============================================");
    console.log("  VERIFYING AUDIT LOG FIX & RECOVERY SUITE    ");
    console.log("===============================================");

    const adminToken = await signToken({
      userId: "USR-001",
      email: "admin@clinic.com",
      name: "Dr. Admin",
      role: "ADMIN",
    });

    const doctorToken = await signToken({
      userId: "USR-002",
      email: "doctor@clinic.com",
      name: "Dr. Vance",
      role: "DOCTOR",
    });

    // Test A: Unauthenticated POST should fail with 401
    const unauthPostReq = new Request("http://localhost:3000/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "LOGIN", module: "AUTH" }),
    });
    const unauthPostRes = await POST(unauthPostReq);
    console.log("Test A (Unauth POST): Status =", unauthPostRes.status, "(Expected 401)");

    // Test B: Authenticated POST should succeed (201)
    const postReq1 = new Request("http://localhost:3000/api/audit-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        id: "LOG-9006",
        action: "LOGIN",
        module: "AUTH",
        description: "User Dr. Vance logged in successfully",
        metadata: { password: "SecretPassword123!", token: "jwt.secret.here", safeField: "SafeData" },
      }),
    });
    const postRes1 = await POST(postReq1);
    const postJson1 = await postRes1.json();
    console.log("Test B (Auth POST 1): Status =", postRes1.status, postJson1.success ? "✅ Created" : postJson1);

    // Test C: Second POST with SAME ID (Duplicate ID handling)
    const postReq2 = new Request("http://localhost:3000/api/audit-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        id: "LOG-9006",
        action: "CREATE",
        module: "PATIENTS",
        description: "Registered new patient",
      }),
    });
    const postRes2 = await POST(postReq2);
    const postJson2 = await postRes2.json();
    console.log("Test C (Duplicate ID POST): Status =", postRes2.status, postJson2.success ? `✅ Managed (New Log ID: ${postJson2.data.logId})` : postJson2);

    // Test D: Verify sensitive values (passwords, tokens) are NOT in persisted audit log
    const savedLog = await AuditLog.findOne({ action: "LOGIN" });
    const hasPasswordInMetadata = savedLog?.metadata?.password !== undefined;
    const hasTokenInMetadata = savedLog?.metadata?.token !== undefined;
    const hasSafeData = savedLog?.metadata?.safeField === "SafeData";
    console.log("Test D (Sensitive Data Redaction): Password Redacted:", !hasPasswordInMetadata, "| Token Redacted:", !hasTokenInMetadata, "| Safe Field Preserved:", hasSafeData);

    // Test E: Unauthenticated GET should fail with 401
    const unauthGetReq = new Request("http://localhost:3000/api/audit-logs", { method: "GET" });
    const unauthGetRes = await GET(unauthGetReq);
    console.log("Test E (Unauth GET): Status =", unauthGetRes.status, "(Expected 401)");

    // Test F: Doctor GET (non-ADMIN) should fail with 403 Forbidden
    const doctorGetReq = new Request("http://localhost:3000/api/audit-logs", {
      method: "GET",
      headers: { "Authorization": `Bearer ${doctorToken}` },
    });
    const doctorGetRes = await GET(doctorGetReq);
    console.log("Test F (Doctor GET): Status =", doctorGetRes.status, "(Expected 403)");

    // Test G: Admin GET should succeed with 200 and return persisted records
    const adminGetReq = new Request("http://localhost:3000/api/audit-logs", {
      method: "GET",
      headers: { "Authorization": `Bearer ${adminToken}` },
    });
    const adminGetRes = await GET(adminGetReq);
    const adminGetJson = await adminGetRes.json();
    console.log("Test G (Admin GET): Status =", adminGetRes.status, `Returned ${adminGetJson.count} logs.`);

    // Check count in MongoDB directly
    const dbCount = await AuditLog.countDocuments();
    console.log("MongoDB Persisted AuditLog Count:", dbCount);

    if (
      postRes1.status === 201 &&
      postRes2.status === 201 &&
      !hasPasswordInMetadata &&
      !hasTokenInMetadata &&
      doctorGetRes.status === 403 &&
      adminGetRes.status === 200 &&
      dbCount >= 2
    ) {
      console.log("\n🎉 AUDIT LOG FIX VERIFIED SUCCESSFULLY!");
    } else {
      console.error("\n❌ AUDIT LOG VERIFICATION FAILED!");
    }

  } catch (err) {
    console.error("Test Runtime Error:", err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runAuditFixTest();
