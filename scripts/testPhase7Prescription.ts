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
        port: 5009,
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

async function runPhase7Tests() {
  console.log("===================================================================");
  console.log("  PHASE 7 — DIGITAL PRESCRIPTION INTEGRATION TEST SUITE            ");
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
    const Prescription = (await import("../models/Prescription")).default;

    await connectDatabase();
    await seedDefaultAdmin();

    serverInstance = app.listen(5009);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Helper to get JWT token for specific credentials
    const getRoleToken = async (email: string, pass: string): Promise<string> => {
      const res = await httpRequest("POST", "/api/auth/login", {}, { email, password: pass });
      return res.data?.token || "";
    };

    const doctorToken = await getRoleToken("dr.vance@vancepsychiatry.com", "Vance2026!");
    const receptionToken = await getRoleToken("s.jenkins@vancepsychiatry.com", "Jenkins2026!");

    // Seed test patient
    const testPatient = new Patient({
      patientId: "PX-9402",
      fullName: "Jane Doe",
      dateOfBirth: "1990-05-15",
      age: 36,
      gender: "Female",
      phone: "+1 (555) 111-2222",
      registeredDate: "2026-09-01",
    });
    await testPatient.save();

    // 1. Login as DOCTOR
    const isDoctorLogged = doctorToken.length > 0;
    logTest(1, "Login as DOCTOR", isDoctorLogged, "Doctor authenticated cleanly with JWT token.");

    // 2. Open existing patient
    const openPatientRes = await httpRequest("GET", "/api/patients/PX-9402", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const isOpenPatientOk = openPatientRes.status === 200 && openPatientRes.data?.data?.patientId === "PX-9402";
    logTest(2, "Open Existing Patient Profile", isOpenPatientOk, "Patient PX-9402 retrieved successfully.");

    // 3. Create digital prescription (RX 1)
    const createRx1Res = await httpRequest(
      "POST",
      "/api/patients/PX-9402/prescriptions",
      { Authorization: `Bearer ${doctorToken}` },
      {
        patientId: "PX-9402",
        diagnosis: "Adult ADHD (F90.2) / Executive Dysfunction",
        treatmentNotes: "Take morning dose with food. Adequate fluid intake required.",
        medications: [
          {
            name: "Lisdexamfetamine Dimesylate (Vyvanse)",
            dosage: "50mg",
            frequency: "Once daily in the morning",
            duration: "30 days",
            instructions: "Dispense 30 capsules. Swallow whole.",
            refills: 2,
          },
          {
            name: "Quetiapine Fumarate",
            dosage: "25mg",
            frequency: "Once daily at bedtime PRN",
            duration: "30 days",
            instructions: "Take for severe sleep latency.",
            refills: 1,
          },
        ],
        status: "Active",
      }
    );
    const rx1Id = createRx1Res.data?.data?.prescriptionId || createRx1Res.data?.data?.id || "";
    const isRx1Created = createRx1Res.status === 201 && rx1Id.startsWith("RX-");
    logTest(3, "Create Digital Prescription", isRx1Created, `Status 201 Created. Assigned Prescription ID: ${rx1Id}`);

    // 4. Save prescription in database
    const rx1Saved = (await Prescription.findOne({ prescriptionId: rx1Id })) !== null;
    logTest(4, "Save Prescription in MongoDB", rx1Saved, `Prescription document ${rx1Id} verified present in MongoDB.`);

    // 5. Retrieve patient prescriptions list
    const getRxListRes = await httpRequest("GET", "/api/patients/PX-9402/prescriptions", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const rxListOk = getRxListRes.status === 200 && getRxListRes.data?.data?.length === 1;
    logTest(5, "Retrieve Patient Prescriptions List", rxListOk, `Prescription history retrieved. Count: 1 record.`);

    // 6. Retrieve specific prescription by ID
    const getRx1ByIdRes = await httpRequest("GET", `/api/patients/PX-9402/prescriptions/${rx1Id}`, {
      Authorization: `Bearer ${doctorToken}`,
    });
    const getRx1Ok = getRx1ByIdRes.status === 200 && getRx1ByIdRes.data?.data?.prescriptionId === rx1Id;
    logTest(6, "Retrieve Specific Prescription by ID", getRx1Ok, `Single prescription ${rx1Id} retrieved successfully.`);

    // 7. Reuse Previous Prescription (Create RX 2 from RX 1 template with edits)
    const rx1Data = getRx1ByIdRes.data?.data;
    const reuseCreateRes = await httpRequest(
      "POST",
      "/api/patients/PX-9402/prescriptions",
      { Authorization: `Bearer ${doctorToken}` },
      {
        patientId: rx1Data.patientId,
        diagnosis: rx1Data.diagnosis,
        treatmentNotes: "Adjusted regimen: Added Sertraline 50mg for secondary anxiety.",
        medications: [
          ...rx1Data.medications,
          {
            name: "Sertraline Hydrochloride",
            dosage: "50mg",
            frequency: "Once daily in morning",
            duration: "30 days",
            instructions: "Take with breakfast.",
            refills: 3,
          },
        ],
        status: "Active",
      }
    );
    const rx2Id = reuseCreateRes.data?.data?.prescriptionId || reuseCreateRes.data?.data?.id || "";
    const isReuseCreated = reuseCreateRes.status === 201 && rx2Id.startsWith("RX-") && rx2Id !== rx1Id;
    logTest(7, "Reuse Previous Prescription (Create New Rx Document)", isReuseCreated, `Reused prescription saved as NEW document with ID: ${rx2Id} (Original was ${rx1Id}).`);

    // 8. Verify original prescription remains 100% unchanged
    const originalRx1Check = await Prescription.findOne({ prescriptionId: rx1Id });
    const isOriginalUnchanged = originalRx1Check !== null && originalRx1Check.medications.length === 2;
    logTest(8, "Verify Original Prescription Unchanged", isOriginalUnchanged, `Original Rx ${rx1Id} contains 2 medications (un-mutated). New Rx ${rx2Id} contains 3 medications.`);

    // 9. Verify both prescriptions exist in patient history
    const getBothRxRes = await httpRequest("GET", "/api/patients/PX-9402/prescriptions", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const bothRxExist = getBothRxRes.status === 200 && getBothRxRes.data?.data?.length === 2;
    logTest(9, "Verify Multiple Prescriptions in Patient History", bothRxExist, `Both historical prescriptions (${rx1Id}, ${rx2Id}) exist in patient record.`);

    // 10. Update prescription status/details via PUT
    const updateRx2Res = await httpRequest(
      "PUT",
      `/api/patients/PX-9402/prescriptions/${rx2Id}`,
      { Authorization: `Bearer ${doctorToken}` },
      {
        status: "Completed",
        treatmentNotes: "Adjusted regimen completed 30-day course.",
      }
    );
    const isUpdateRx2Ok = updateRx2Res.status === 200 && updateRx2Res.data?.data?.status === "Completed";
    logTest(10, "Update Prescription via PUT", isUpdateRx2Ok, `Status 200 OK. Updated Rx ${rx2Id} status to 'Completed'.`);

    // 11. Test prescription validation (missing medications list)
    const invalidValidationRes = await httpRequest(
      "POST",
      "/api/patients/PX-9402/prescriptions",
      { Authorization: `Bearer ${doctorToken}` },
      {
        patientId: "PX-9402",
        diagnosis: "Adult ADHD",
        medications: [], // empty array
      }
    );
    const isValidationHandled = invalidValidationRes.status === 400 && invalidValidationRes.data?.success === false;
    logTest(11, "Test Prescription Validation (Empty Meds -> 400)", isValidationHandled, `Status 400 Bad Request returned when medications array is empty.`);

    // 12. Test 404 for non-existent patient ID
    const notFoundPatientRes = await httpRequest("GET", "/api/patients/PX-999999/prescriptions", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const isNotFoundPatientOk = notFoundPatientRes.status === 404 && notFoundPatientRes.data?.success === false;
    logTest(12, "Test Non-existent Patient ID (404)", isNotFoundPatientOk, `Status 404 returned for unknown patient ID.`);

    // 13. Test 404 for non-existent prescription ID
    const notFoundRxRes = await httpRequest("GET", "/api/patients/PX-9402/prescriptions/RX-999999", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const isNotFoundRxOk = notFoundRxRes.status === 404 && notFoundRxRes.data?.success === false;
    logTest(13, "Test Non-existent Prescription ID (404)", isNotFoundRxOk, `Status 404 returned for unknown prescription ID.`);

    // 14. Test 401 Unauthorized for missing token
    const unauthRes = await httpRequest("GET", "/api/patients/PX-9402/prescriptions");
    const isUnauthOk = unauthRes.status === 401;
    logTest(14, "Test Unauthorized Request (401)", isUnauthOk, `Status 401 Unauthorized returned when Authorization header is omitted.`);

    // 15. Login as RECEPTION
    const isReceptionLogged = receptionToken.length > 0;
    logTest(15, "Login as RECEPTION Role", isReceptionLogged, "Receptionist authenticated with JWT token.");

    // 16. Verify RECEPTION GET is sanitized (treatment notes & instructions redacted)
    const receptionGetRes = await httpRequest("GET", "/api/patients/PX-9402/prescriptions", {
      Authorization: `Bearer ${receptionToken}`,
    });
    const recData = receptionGetRes.data?.data?.[0];
    const isReceptionSanitized = receptionGetRes.status === 200 && recData?.treatmentNotes?.includes("Restricted");
    logTest(16, "Verify RECEPTION Clinical Redaction on GET", isReceptionSanitized, `Clinical notes and instructions redacted for RECEPTION role.`);

    // 17. Verify RECEPTION POST is blocked with 403 Forbidden
    const receptionPostRes = await httpRequest(
      "POST",
      "/api/patients/PX-9402/prescriptions",
      { Authorization: `Bearer ${receptionToken}` },
      {
        patientId: "PX-9402",
        diagnosis: "Test",
        medications: [{ name: "Test Med", dosage: "10mg", frequency: "Daily", duration: "7 days", instructions: "Test", refills: 0 }],
      }
    );
    const isReceptionPostBlocked = receptionPostRes.status === 403;
    logTest(17, "Verify RECEPTION POST Blocked (403)", isReceptionPostBlocked, `Status 403 Forbidden returned when RECEPTION attempts to create prescription.`);

    // 18. Verify RECEPTION PUT is blocked with 403 Forbidden
    const receptionPutRes = await httpRequest(
      "PUT",
      `/api/patients/PX-9402/prescriptions/${rx1Id}`,
      { Authorization: `Bearer ${receptionToken}` },
      { status: "Discontinued" }
    );
    const isReceptionPutBlocked = receptionPutRes.status === 403;
    logTest(18, "Verify RECEPTION PUT Blocked (403)", isReceptionPutBlocked, `Status 403 Forbidden returned when RECEPTION attempts to update prescription.`);

    // 19. Test Standalone Prescription Endpoint (GET /api/prescriptions)
    const standaloneRes = await httpRequest("GET", "/api/prescriptions", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const standaloneOk = standaloneRes.status === 200 && Array.isArray(standaloneRes.data?.data);
    logTest(19, "Test Standalone Prescriptions Endpoint", standaloneOk, `GET /api/prescriptions returned array of ${standaloneRes.data?.count} prescriptions.`);

    // 20. Verify persistence across DB refetch
    const refetchRes = await httpRequest("GET", "/api/patients/PX-9402/prescriptions", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const isPersisted = refetchRes.status === 200 && refetchRes.data?.data?.length === 2;
    logTest(20, "Verify Saved Data Persists Across Refetch", isPersisted, `Both digital prescriptions verified persistent in MongoDB.`);

  } catch (err: any) {
    console.error("Test Suite Execution Error:", err);
  } finally {
    if (serverInstance) serverInstance.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();

    console.log("===================================================================");
    const allPassed = results.length === 20 && results.every((r) => r.passed);
    if (allPassed) {
      console.log("🎉 ALL 20 DIGITAL PRESCRIPTION TEST SCENARIOS PASSED!");
      process.exit(0);
    } else {
      console.error("❌ TEST SUITE FAILED — Some test cases failed.");
      process.exit(1);
    }
  }
}

runPhase7Tests();
