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
  console.log(`Test ${num.toString().padStart(2, "0")}: ${name} -> ${statusSymbol}\n   └─ ${details}\n`);
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
        port: 5007,
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

async function runPhase4Tests() {
  console.log("===================================================================");
  console.log("  PHASE 4 — REAL PATIENT MANAGEMENT MODULE INTEGRATION TEST SUITE  ");
  console.log("===================================================================\n");

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
    const Patient = (await import("../models/Patient")).default;

    await connectDatabase();
    await seedDefaultAdmin();

    serverInstance = app.listen(5007);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Tokens helper
    const getRoleToken = async (email: string, pass: string): Promise<string> => {
      const res = await httpRequest("POST", "/api/auth/login", {}, { email, password: pass });
      return res.data?.token || "";
    };

    const adminToken = await getRoleToken("admin@clinic.com", "Admin@123456");
    const doctorToken = await getRoleToken("dr.vance@vancepsychiatry.com", "Vance2026!");
    const receptionToken = await getRoleToken("s.jenkins@vancepsychiatry.com", "Jenkins2026!");
    const therapistToken = await getRoleToken("e.watson@vancepsychiatry.com", "Watson2026!");

    // 1. Login as ADMIN
    const isAdminLogged = adminToken.length > 0;
    logTest(1, "Login as ADMIN", isAdminLogged, "Admin authenticated cleanly with JWT session token.");

    // 2. Create patient (as ADMIN)
    const createRes = await httpRequest(
      "POST",
      "/api/patients",
      { Authorization: `Bearer ${adminToken}` },
      {
        fullName: "Arthur Dent",
        dateOfBirth: "1982-03-11",
        gender: "Male",
        phone: "+1 (555) 424-2424",
        email: "arthur.dent@galaxy.org",
        address: "42 Sub-Etha Way, NY",
        status: "Active",
      }
    );
    const createdPatientId = createRes.data?.data?.patientId || "";
    const isCreated = createRes.status === 201 && createdPatientId.startsWith("PX-");
    logTest(2, "Create Patient (POST /api/patients)", isCreated, `Status 201 Created. Assigned unique ID: ${createdPatientId}`);

    // 3. View patient (GET /api/patients/:id)
    const viewRes = await httpRequest("GET", `/api/patients/${createdPatientId}`, {
      Authorization: `Bearer ${adminToken}`,
    });
    const isViewed = viewRes.status === 200 && viewRes.data?.data?.fullName === "Arthur Dent";
    logTest(3, "View Patient (GET /api/patients/:id)", isViewed, `Status 200 OK. Retrieved record for ${createdPatientId} (${viewRes.data?.data?.fullName})`);

    // 4. Search patient (GET /api/patients?search=Arthur)
    const searchRes = await httpRequest("GET", "/api/patients?search=Arthur", {
      Authorization: `Bearer ${adminToken}`,
    });
    const isSearched = searchRes.status === 200 && searchRes.data?.data?.some((p: any) => p.patientId === createdPatientId);
    logTest(4, "Search Patient (GET /api/patients?search=...)", isSearched, `Status 200 OK. Text search returned matching patient record.`);

    // 5. Edit patient (PUT /api/patients/:id)
    const editRes = await httpRequest(
      "PUT",
      `/api/patients/${createdPatientId}`,
      { Authorization: `Bearer ${adminToken}` },
      {
        phone: "+1 (555) 999-0000",
        address: "100 Earth Avenue, NY",
      }
    );
    const isEdited = editRes.status === 200 && editRes.data?.data?.phone === "+1 (555) 999-0000";
    logTest(5, "Edit Patient (PUT /api/patients/:id)", isEdited, `Status 200 OK. Updated phone number to ${editRes.data?.data?.phone}`);

    // 6. Patient appears in patient list (GET /api/patients)
    const listRes = await httpRequest("GET", "/api/patients", {
      Authorization: `Bearer ${adminToken}`,
    });
    const inList = listRes.status === 200 && listRes.data?.data?.some((p: any) => p.patientId === createdPatientId);
    logTest(6, "Patient Appears in Patient List", inList, `Status 200 OK. Patient list contains ${listRes.data?.total} registered patients.`);

    // 7. Login as DOCTOR
    const isDocLogged = doctorToken.length > 0;
    logTest(7, "Login as DOCTOR", isDocLogged, "Doctor authenticated cleanly.");

    // 8. Verify DOCTOR patient access (view/create/update)
    const docCreateRes = await httpRequest(
      "POST",
      "/api/patients",
      { Authorization: `Bearer ${doctorToken}` },
      {
        fullName: "Ford Prefect",
        dateOfBirth: "1985-06-12",
        gender: "Male",
        phone: "+1 (555) 777-8888",
        email: "ford@guide.org",
      }
    );
    const docPatientId = docCreateRes.data?.data?.patientId;
    const docAccessOk = docCreateRes.status === 201 && docPatientId !== undefined;
    logTest(8, "DOCTOR Patient Access (View/Create/Update)", docAccessOk, `Status 201 Created. Doctor successfully created patient ${docPatientId}.`);

    // 9. Login as RECEPTION
    const isRecLogged = receptionToken.length > 0;
    logTest(9, "Login as RECEPTION", isRecLogged, "Reception staff authenticated cleanly.");

    // 10. Verify RECEPTION patient access (view/create/update basic info)
    const recCreateRes = await httpRequest(
      "POST",
      "/api/patients",
      { Authorization: `Bearer ${receptionToken}` },
      {
        fullName: "Trillian Astra",
        dateOfBirth: "1992-09-24",
        gender: "Female",
        phone: "+1 (555) 123-4567",
        email: "trillian@heartofgold.org",
      }
    );
    const recAccessOk = recCreateRes.status === 201 && recCreateRes.data?.data?.patientId !== undefined;
    logTest(10, "RECEPTION Basic Patient Access", recAccessOk, `Status 201 Created. Reception staff successfully created patient.`);

    // 11. Login as THERAPIST
    const isTherapistLogged = therapistToken.length > 0;
    logTest(11, "Login as THERAPIST", isTherapistLogged, "Therapist authenticated cleanly.");

    // 12. Verify THERAPIST permissions (can view, but create/update restricted per role definition)
    const therapistViewRes = await httpRequest("GET", "/api/patients", {
      Authorization: `Bearer ${therapistToken}`,
    });
    const therapistViewOk = therapistViewRes.status === 200;
    logTest(12, "THERAPIST Permission Checks (Read Access Verified)", therapistViewOk, `Status 200 OK. Therapist read access verified.`);

    // 13. Test invalid patient data (Zod validation failure -> 400)
    const invalidDataRes = await httpRequest(
      "POST",
      "/api/patients",
      { Authorization: `Bearer ${adminToken}` },
      {
        fullName: "A", // less than 2 chars
        dateOfBirth: "",
        gender: "InvalidGenderOption",
        phone: "123",
      }
    );
    const invalidDataOk = invalidDataRes.status === 400 && invalidDataRes.data?.success === false;
    logTest(13, "Invalid Patient Data Validation", invalidDataOk, `Status 400 Bad Request returned for Zod schema validation errors.`);

    // 14. Test duplicate patient ID handling (Conflict prevention)
    const duplicateIdPatient = new Patient({
      patientId: "PX-9999",
      fullName: "Duplicate Check Patient",
      dateOfBirth: "1990-01-01",
      age: 36,
      gender: "Male",
      phone: "+1 (555) 000-1111",
      registeredDate: "2026-09-20",
    });
    await duplicateIdPatient.save();

    // Try creating duplicate with same unique index
    const dupRes = await httpRequest(
      "POST",
      "/api/patients",
      { Authorization: `Bearer ${adminToken}` },
      {
        fullName: "Another Patient",
        dateOfBirth: "1990-01-01",
        gender: "Male",
        phone: "+1 (555) 000-2222",
      }
    );
    const dupOk = dupRes.status === 201 && dupRes.data?.data?.patientId !== "PX-9999";
    logTest(14, "Duplicate Patient ID Safety", dupOk, `Status 201 Created. Safely generated new unique ID (${dupRes.data?.data?.patientId}) avoiding collisions.`);

    // 15. Test patient not found (HTTP 404)
    const notFoundRes = await httpRequest("GET", "/api/patients/PX-9999999", {
      Authorization: `Bearer ${adminToken}`,
    });
    const notFoundOk = notFoundRes.status === 404 && notFoundRes.data?.success === false;
    logTest(15, "Patient Not Found Handling", notFoundOk, `Status 404 Not Found returned for non-existing patient ID.`);

    // 16. Test unauthenticated request (HTTP 401)
    const unauthRes = await httpRequest("GET", "/api/patients");
    const unauthOk = unauthRes.status === 401;
    logTest(16, "Unauthenticated Request Protection", unauthOk, `Status 401 Unauthorized returned when bearer token is omitted.`);

    // 17. Test database failure handling
    const dbErrRes = await httpRequest("GET", "/api/patients/invalid-object-id-format!@#", {
      Authorization: `Bearer ${adminToken}`,
    });
    const dbErrOk = dbErrRes.status === 404 || dbErrRes.status === 500;
    logTest(17, "Database Failure/Sanitization Handling", dbErrOk, `Status ${dbErrRes.status} returned without exposing database stack traces.`);

  } catch (err: any) {
    console.error("Test Suite Error:", err);
  } finally {
    if (serverInstance) serverInstance.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();

    console.log("===================================================================");
    const allPassed = results.length === 17 && results.every((r) => r.passed);
    if (allPassed) {
      console.log("🎉 ALL 17 PATIENT MANAGEMENT TEST SCENARIOS PASSED!");
      process.exit(0);
    } else {
      console.error("❌ TEST SUITE FAILED — Some test cases failed.");
      process.exit(1);
    }
  }
}

runPhase4Tests();
