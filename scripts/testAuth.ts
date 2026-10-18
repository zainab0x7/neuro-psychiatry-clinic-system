process.env.SKIP_SERVER_START = "true";

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import http from "http";

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function logTest(num: number, name: string, passed: boolean, details: string) {
  results.push({ num, name, passed, details });
  const statusSymbol = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`Test ${num}: ${name} -> ${statusSymbol} (${details})`);
}

async function httpRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: unknown
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const reqHeaders: Record<string, string> = { ...headers };

    if (payload) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 5005,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          let parsedData: any;
          try {
            parsedData = JSON.parse(rawData);
          } catch {
            parsedData = rawData;
          }
          resolve({ status: res.statusCode || 500, data: parsedData, headers: res.headers });
        });
      }
    );

    req.on("error", (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log("=================================================");
  console.log("  PHASE 2 — MONGODB & AUTHENTICATION TEST SUITE  ");
  console.log("=================================================");

  let mongoServer: MongoMemoryServer | null = null;
  let serverInstance: http.Server | null = null;

  try {
    // 1. Setup in-memory MongoDB server BEFORE importing backend modules
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    process.env.SESSION_SECRET = "super_secret_test_key_32_characters_long_minimum";

    // Dynamic import to ensure MONGODB_URI is set prior to module evaluation
    const { connectDatabase } = await import("../backend/config/database");
    const { seedDefaultAdmin } = await import("../backend/config/seedAdmin");
    const app = (await import("../backend/server")).default;
    const User = (await import("../models/User")).default;

    await connectDatabase();
    const dbConnected = mongoose.connection.readyState === 1;

    logTest(
      1,
      "MongoDB Connection",
      dbConnected,
      dbConnected ? `Connected cleanly to Mongoose URI: ${mongoUri}` : "Database connection state invalid"
    );

    // Bootstrap default admin
    await seedDefaultAdmin();

    // Start test server on port 5005
    serverInstance = app.listen(5005);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 2. Login with Valid Credentials
    const validLoginRes = await httpRequest("POST", "/api/auth/login", {}, {
      email: "admin@clinic.com",
      password: "Admin@123456",
    });

    const isLoginValid =
      validLoginRes.status === 200 &&
      validLoginRes.data?.success === true &&
      typeof validLoginRes.data?.token === "string" &&
      validLoginRes.data?.user?.email === "admin@clinic.com" &&
      validLoginRes.data?.user?.passwordHash === undefined;

    const adminToken = validLoginRes.data?.token || "";

    logTest(
      2,
      "Login with Valid Credentials",
      isLoginValid,
      isLoginValid
        ? `Status 200, returned valid JWT token & safe user profile (passwordHash excluded)`
        : `Unexpected response: ${JSON.stringify(validLoginRes.data)}`
    );

    // 3. Login with Invalid Credentials
    const invalidLoginRes = await httpRequest("POST", "/api/auth/login", {}, {
      email: "admin@clinic.com",
      password: "WrongPassword999!",
    });

    const isLoginInvalidHandled = invalidLoginRes.status === 401 && invalidLoginRes.data?.success === false;

    logTest(
      3,
      "Login with Invalid Credentials",
      isLoginInvalidHandled,
      isLoginInvalidHandled ? "Status 401 Unauthorized returned correctly" : `Status ${invalidLoginRes.status}`
    );

    // 4. Inactive User Login Attempt
    const inactiveUser = new User({
      userId: "USR-099",
      name: "Deactivated Staff",
      email: "disabled@clinic.com",
      passwordHash: "DeactivatedPass123!",
      role: "RECEPTION",
      isActive: false,
    });
    await inactiveUser.save();

    const inactiveLoginRes = await httpRequest("POST", "/api/auth/login", {}, {
      email: "disabled@clinic.com",
      password: "DeactivatedPass123!",
    });

    const isInactiveBlocked = inactiveLoginRes.status === 403;

    logTest(
      4,
      "Inactive User Login Attempt",
      isInactiveBlocked,
      isInactiveBlocked
        ? "Status 403 Forbidden returned for deactivated account"
        : `Status ${inactiveLoginRes.status}`
    );

    // 5. Unauthenticated Protected Request
    const unauthRes = await httpRequest("GET", "/api/auth/me");
    const isUnauthBlocked = unauthRes.status === 401;

    logTest(
      5,
      "Unauthenticated Protected Request",
      isUnauthBlocked,
      isUnauthBlocked ? "Status 401 Unauthorized returned for missing token" : `Status ${unauthRes.status}`
    );

    // 6. Authenticated Request
    const authRes = await httpRequest("GET", "/api/auth/me", {
      Authorization: `Bearer ${adminToken}`,
    });

    const isAuthSuccess =
      authRes.status === 200 &&
      authRes.data?.user?.email === "admin@clinic.com" &&
      authRes.data?.user?.passwordHash === undefined;

    logTest(
      6,
      "Authenticated Request (GET /api/auth/me)",
      isAuthSuccess,
      isAuthSuccess
        ? `Status 200, returned safe user profile for ${authRes.data?.user?.name}`
        : `Status ${authRes.status}`
    );

    // 7. Admin User Creation (POST /api/users)
    const createUserRes = await httpRequest(
      "POST",
      "/api/users",
      { Authorization: `Bearer ${adminToken}` },
      {
        name: "Dr. Sarah Connor",
        email: "sarah.connor@clinic.com",
        password: "DoctorPassword123!",
        role: "DOCTOR",
        title: "Senior Psychiatrist",
        department: "Clinical Psychiatry",
      }
    );

    const isUserCreated =
      createUserRes.status === 201 &&
      createUserRes.data?.user?.email === "sarah.connor@clinic.com" &&
      createUserRes.data?.user?.role === "DOCTOR" &&
      createUserRes.data?.user?.passwordHash === undefined;

    logTest(
      7,
      "Admin User Creation (POST /api/users)",
      isUserCreated,
      isUserCreated
        ? `Status 201 Created, new DOCTOR staff account created (USR-002)`
        : `Status ${createUserRes.status}: ${JSON.stringify(createUserRes.data)}`
    );

    // 8. Role-Restricted Request
    // Login as the created DOCTOR staff member
    const doctorLoginRes = await httpRequest("POST", "/api/auth/login", {}, {
      email: "sarah.connor@clinic.com",
      password: "DoctorPassword123!",
    });
    const doctorToken = doctorLoginRes.data?.token || "";

    // Doctor attempts to call Admin-only route (POST /api/users)
    const unauthorizedRoleRes = await httpRequest(
      "POST",
      "/api/users",
      { Authorization: `Bearer ${doctorToken}` },
      {
        name: "Unauthorized Staff",
        email: "unauth@clinic.com",
        password: "Password123!",
        role: "THERAPIST",
      }
    );

    const isRoleRestrictedBlocked = unauthorizedRoleRes.status === 403;

    logTest(
      8,
      "Role-Restricted Request (Require ADMIN)",
      isRoleRestrictedBlocked,
      isRoleRestrictedBlocked
        ? "Status 403 Forbidden returned when DOCTOR role attempted ADMIN user creation endpoint"
        : `Status ${unauthorizedRoleRes.status}`
    );
  } catch (err: any) {
    console.error("Test Suite Runtime Error:", err);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log("=================================================");
    const allPassed = results.length === 8 && results.every((r) => r.passed);
    if (allPassed) {
      console.log("🎉 ALL 8 MANDATORY TEST SUITE SCENARIOS PASSED!");
      process.exit(0);
    } else {
      console.error("❌ TEST SUITE FAILED — Some tests failed.");
      process.exit(1);
    }
  }
}

runTests();
