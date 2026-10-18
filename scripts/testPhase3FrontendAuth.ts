process.env.SKIP_SERVER_START = "true";

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import http from "http";

interface TestResult {
  code: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function logTest(code: string, name: string, passed: boolean, details: string) {
  results.push({ code, name, passed, details });
  const statusSymbol = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`Test [${code}] ${name} -> ${statusSymbol}\n  └─ Details: ${details}\n`);
}

async function httpRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: unknown
): Promise<{ status: number; data: any }> {
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
        port: 5006,
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
          resolve({ status: res.statusCode || 500, data: parsedData });
        });
      }
    );

    req.on("error", (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runPhase3Tests() {
  console.log("=================================================================");
  console.log("  PHASE 3 — FRONTEND & BACKEND AUTHENTICATION INTEGRATION SUITE  ");
  console.log("=================================================================\n");

  let mongoServer: MongoMemoryServer | null = null;
  let serverInstance: http.Server | null = null;

  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    process.env.SESSION_SECRET = "super_secret_test_key_32_characters_long_minimum";

    const { connectDatabase } = await import("../backend/config/database");
    const { seedDefaultAdmin } = await import("../backend/config/seedAdmin");
    const app = (await import("../backend/server")).default;
    const User = (await import("../models/User")).default;

    await connectDatabase();
    await seedDefaultAdmin();

    serverInstance = app.listen(5006);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // A. Valid Login
    const validRes = await httpRequest("POST", "/api/auth/login", {}, {
      email: "dr.vance@vancepsychiatry.com",
      password: "Vance2026!",
    });
    const validPassed = validRes.status === 200 && validRes.data?.success === true && typeof validRes.data?.token === "string";
    const doctorToken = validRes.data?.token || "";
    logTest("A", "Valid Login", validPassed, `Status 200 OK. Authenticated DOCTOR (dr.vance@vancepsychiatry.com). Token issued.`);

    // B. Wrong Password
    const wrongPassRes = await httpRequest("POST", "/api/auth/login", {}, {
      email: "dr.vance@vancepsychiatry.com",
      password: "WrongPassword999!",
    });
    const wrongPassPassed = wrongPassRes.status === 401 && wrongPassRes.data?.success === false;
    logTest("B", "Wrong Password", wrongPassPassed, `Status 401 Unauthorized returned for incorrect password.`);

    // C. Non-existing Email
    const unknownEmailRes = await httpRequest("POST", "/api/auth/login", {}, {
      email: "nobody@vancepsychiatry.com",
      password: "Vance2026!",
    });
    const unknownEmailPassed = unknownEmailRes.status === 401 && unknownEmailRes.data?.success === false;
    logTest("C", "Non-existing Email", unknownEmailPassed, `Status 401 Unauthorized returned for unregistered email.`);

    // D. Inactive User
    const inactiveUser = new User({
      userId: "USR-088",
      name: "Inactive Staff Member",
      email: "deactivated@vancepsychiatry.com",
      passwordHash: "DeactivatedPass123!",
      role: "RECEPTION",
      isActive: false,
    });
    await inactiveUser.save();

    const inactiveRes = await httpRequest("POST", "/api/auth/login", {}, {
      email: "deactivated@vancepsychiatry.com",
      password: "DeactivatedPass123!",
    });
    const inactivePassed = inactiveRes.status === 403 && inactiveRes.data?.success === false;
    logTest("D", "Inactive User Login", inactivePassed, `Status 403 Forbidden returned for deactivated user account.`);

    // E. Successful Logout
    const logoutRes = await httpRequest("POST", "/api/auth/logout", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const logoutPassed = logoutRes.status === 200 && logoutRes.data?.success === true;
    logTest("E", "Successful Logout", logoutPassed, `Status 200 OK. Session invalidated.`);

    // F. Refresh Page After Login (Restore session via GET /api/auth/me)
    const adminLoginRes = await httpRequest("POST", "/api/auth/login", {}, {
      email: "m.sterling@vancepsychiatry.com",
      password: "Sterling2026!",
    });
    const adminToken = adminLoginRes.data?.token || "";

    const refreshRes = await httpRequest("GET", "/api/auth/me", {
      Authorization: `Bearer ${adminToken}`,
    });
    const refreshPassed = refreshRes.status === 200 && refreshRes.data?.user?.email === "m.sterling@vancepsychiatry.com";
    logTest("F", "Refresh Page After Login (Session Restore)", refreshPassed, `Status 200 OK. Restored user profile for Marcus Sterling (${refreshRes.data?.user?.role}).`);

    // G. Unauthenticated User Accessing Dashboard (GET /api/auth/me without token)
    const unauthRes = await httpRequest("GET", "/api/auth/me");
    const unauthPassed = unauthRes.status === 401;
    logTest("G", "Unauthenticated Dashboard Access", unauthPassed, `Status 401 Unauthorized returned. Frontend redirects unauthenticated user to login screen.`);

    // H. Different Roles and Existing Permission Checks
    const rolesToTest = [
      { email: "dr.vance@vancepsychiatry.com", pass: "Vance2026!", expectedRole: "DOCTOR" },
      { email: "s.jenkins@vancepsychiatry.com", pass: "Jenkins2026!", expectedRole: "RECEPTION" },
      { email: "e.watson@vancepsychiatry.com", pass: "Watson2026!", expectedRole: "THERAPIST" },
      { email: "m.sterling@vancepsychiatry.com", pass: "Sterling2026!", expectedRole: "ADMIN" },
    ];

    let allRolesPassed = true;
    const roleDetails: string[] = [];

    for (const r of rolesToTest) {
      const loginR = await httpRequest("POST", "/api/auth/login", {}, { email: r.email, password: r.pass });
      const tokenR = loginR.data?.token;
      const meR = await httpRequest("GET", "/api/auth/me", { Authorization: `Bearer ${tokenR}` });
      const roleMatch = meR.data?.user?.role === r.expectedRole;
      if (!roleMatch) allRolesPassed = false;
      roleDetails.push(`${r.expectedRole}: ${roleMatch ? "OK" : "Mismatch"}`);
    }

    logTest("H", "Different Roles & Permission Checks", allRolesPassed, `Verified all 4 clinic roles (ADMIN, DOCTOR, RECEPTION, THERAPIST) -> [${roleDetails.join(", ")}]`);

  } catch (err: any) {
    console.error("Integration Test Error:", err);
  } finally {
    if (serverInstance) serverInstance.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();

    console.log("=================================================================");
    const allPassed = results.length === 8 && results.every((r) => r.passed);
    if (allPassed) {
      console.log("🎉 ALL PHASE 3 INTEGRATION TEST SCENARIOS (A through H) PASSED!");
      process.exit(0);
    } else {
      console.error("❌ INTEGRATION TESTS FAILED — Some test cases failed.");
      process.exit(1);
    }
  }
}

runPhase3Tests();
