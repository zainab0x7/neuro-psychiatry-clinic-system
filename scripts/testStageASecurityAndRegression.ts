import express from "express";
import http from "http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { securityHeaders, authRateLimiter, adminRateLimiter, generalRateLimiter } from "../backend/middleware/securityMiddleware";
import authRoutes from "../backend/routes/authRoutes";
import userRoutes from "../backend/routes/userRoutes";
import patientRoutes from "../backend/routes/patientRoutes";
import consultationRoutes from "../backend/routes/consultationRoutes";
import prescriptionRoutes from "../backend/routes/prescriptionRoutes";
import appointmentRoutes from "../backend/routes/appointmentRoutes";
import therapyRoutes from "../backend/routes/therapyRoutes";
import auditRoutes from "../backend/routes/auditRoutes";
import backupRoutes from "../backend/routes/backupRoutes";
import { notFoundHandler, errorHandler } from "../backend/middleware/errorMiddleware";
import User from "../models/User";
import Patient from "../models/Patient";
import AuditLog from "../models/AuditLog";
import { seedDefaultAdmin } from "../backend/config/seedAdmin";

const PORT = 5019;
const BASE_URL = `http://localhost:${PORT}`;

async function runStageATestSuite() {
  console.log("=================================================");
  console.log("   STAGE A: SECURITY, PERFORMANCE & REGRESSION  ");
  console.log("=================================================\n");

  let mongoServer: MongoMemoryServer | null = null;
  let server: http.Server | null = null;

  try {
    // 1. Setup MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log("✅ 1. MongoDB Connected:", uri);

    // 2. Setup Express App
    const app = express();
    app.use(securityHeaders);
    app.use(express.json({ limit: "2mb" }));
    app.use(express.urlencoded({ extended: true, limit: "2mb" }));

    app.use("/api", generalRateLimiter);
    app.use("/api/auth", authRateLimiter, authRoutes);
    app.use("/api/users", adminRateLimiter, userRoutes);
    app.use("/api/audit-logs", adminRateLimiter, auditRoutes);
    app.use("/api/backup", adminRateLimiter, backupRoutes);
    app.use("/api/patients", patientRoutes);
    app.use("/api/consultations", consultationRoutes);
    app.use("/api/prescriptions", prescriptionRoutes);
    app.use("/api/appointments", appointmentRoutes);
    app.use("/api/therapy-sessions", therapyRoutes);
    app.use("/api/therapy", therapyRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => resolve());
    });
    console.log(`✅ 2. Test Server active on ${BASE_URL}\n`);

    // 3. Seed Default Admin User
    await seedDefaultAdmin();

    // --- TEST 1: Security Headers Verification ---
    console.log("--- TEST 1: Security Response Headers ---");
    const resHeaders = await fetch(`${BASE_URL}/api/auth/me`);
    const xFrame = resHeaders.headers.get("x-frame-options");
    const xContentType = resHeaders.headers.get("x-content-type-options");
    const hsts = resHeaders.headers.get("strict-transport-security");
    if (xFrame === "DENY" && xContentType === "nosniff" && hsts) {
      console.log("✅ PASS: Security headers enforced (X-Frame-Options: DENY, X-Content-Type-Options: nosniff)");
    } else {
      throw new Error(`Security headers missing! Found: X-Frame=${xFrame}, X-Content-Type=${xContentType}`);
    }

    // --- TEST 2: Admin Login & JWT Issuance ---
    console.log("\n--- TEST 2: Authentication & Token Issuance ---");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@clinic.com", password: "Admin@123456" }),
    });
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) {
      throw new Error(`Admin login failed: ${loginData.error || 'No token'}`);
    }
    const adminToken = loginData.token;
    console.log("✅ PASS: Admin user authenticated successfully (JWT Token issued)");

    // --- TEST 3: Rate Limiting Enforcement ---
    console.log("\n--- TEST 3: Rate Limiting Headers & Throttling Check ---");
    const rateCheck = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@clinic.com", password: "WrongPassword" }),
    });
    const limitHeader = rateCheck.headers.get("x-ratelimit-limit");
    const remainingHeader = rateCheck.headers.get("x-ratelimit-remaining");
    if (limitHeader && remainingHeader) {
      console.log(`✅ PASS: Rate limit headers active (Limit: ${limitHeader}, Remaining: ${remainingHeader})`);
    } else {
      throw new Error("Rate limit headers missing!");
    }

    // --- TEST 4: Pagination Verification ---
    console.log("\n--- TEST 4: Paginated List Endpoints ---");
    const paginatedRes = await fetch(`${BASE_URL}/api/users?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const paginatedData = await paginatedRes.json();
    if (paginatedData.success && paginatedData.pagination && paginatedData.pagination.page === 1) {
      console.log("✅ PASS: Users list endpoint returned paginated structure with total counts:", paginatedData.pagination);
    } else {
      throw new Error("Pagination structure verification failed!");
    }

    // --- TEST 5: Role Escalation Prevention ---
    console.log("\n--- TEST 5: Role Escalation & Permission Boundaries ---");
    // Create Doctor User
    const docRes = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dr. Gregory House",
        email: "house@vancepsychiatry.com",
        password: "DoctorPassword123!",
        role: "DOCTOR",
      }),
    });
    const docData = await docRes.json();
    console.log("✅ PASS: Admin created DOCTOR user:", docData.user.userId);

    // Doctor Login
    const docLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "house@vancepsychiatry.com", password: "DoctorPassword123!" }),
    });
    const docLoginData = await docLoginRes.json();
    const docToken = docLoginData.token;

    // Doctor attempts to access Admin-only /api/users endpoint
    const blockedRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    if (blockedRes.status === 403) {
      console.log("✅ PASS: Doctor role blocked from admin user management endpoint (403 Forbidden)");
    } else {
      throw new Error("Role boundary failed! Doctor accessed admin endpoint!");
    }

    // --- TEST 6: Audit Log Integrity & Sensitive Data Redaction ---
    console.log("\n--- TEST 6: Audit Log Redaction Verification ---");
    const auditRes = await fetch(`${BASE_URL}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();
    const logsString = JSON.stringify(auditData.data || []);
    if (!logsString.includes("AdminPassword123!") && !logsString.includes("DoctorPassword123!")) {
      console.log("✅ PASS: Zero password or credential leakage detected in Audit Logs.");
    } else {
      throw new Error("CRITICAL: Raw password detected in Audit Log payload!");
    }

    console.log("\n=================================================");
    console.log("  🎉 ALL STAGE A SECURITY & REGRESSION TESTS PASSED!");
    console.log("=================================================\n");

  } catch (err: any) {
    console.error("\n❌ STAGE A TEST FAILED:", err.message || err);
    process.exit(1);
  } finally {
    if (server) {
      (server as http.Server).close();
    }
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runStageATestSuite();
