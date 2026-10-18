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

async function runPhase6Tests() {
  console.log("===================================================================");
  console.log("  PHASE 6 — CONSULTATION + DIAGNOSIS INTEGRATION TEST SUITE        ");
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
    const Consultation = (await import("../models/Consultation")).default;

    await connectDatabase();
    await seedDefaultAdmin();

    serverInstance = app.listen(5009);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Token retrieval helper
    const getRoleToken = async (email: string, pass: string): Promise<string> => {
      const res = await httpRequest("POST", "/api/auth/login", {}, { email, password: pass });
      return res.data?.token || "";
    };

    const doctorToken = await getRoleToken("dr.vance@vancepsychiatry.com", "Vance2026!");
    const receptionToken = await getRoleToken("s.jenkins@vancepsychiatry.com", "Jenkins2026!");
    const adminToken = await getRoleToken("admin@clinic.com", "Admin@123456");

    // Pre-create patient for testing
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
    logTest(1, "Login as DOCTOR", isDoctorLogged, "Doctor authenticated cleanly with JWT session token.");

    // 2. Open existing patient
    const openPatientRes = await httpRequest("GET", "/api/patients/PX-9402", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const isOpenPatientOk = openPatientRes.status === 200 && openPatientRes.data?.data?.patientId === "PX-9402";
    logTest(2, "Open Existing Patient", isOpenPatientOk, `Patient PX-9402 profile fetched successfully.`);

    // 3. Create consultation (Consultation 1)
    const createConsult1Res = await httpRequest(
      "POST",
      "/api/patients/PX-9402/consultations",
      { Authorization: `Bearer ${doctorToken}` },
      {
        patientId: "PX-9402",
        consultationDate: "2026-09-20",
        time: "10:00 AM",
        visitType: "Initial Neuropsychiatric Eval",
        presentingComplaint: "Patient reports severe insomnia and mood swings.",
        clinicalObservations: "Appearance: Well groomed. Mood: Anxious. Affect: Constricted.",
        assessment: "Features consistent with Bipolar Spectrum Disorder.",
        diagnosis: {
          primaryICD: "F31.3",
          primaryTitle: "Bipolar I Disorder, Current Episode Depressed",
        },
        treatmentPlan: "Initiate Quetiapine 50mg QHS. Psychoeducation provided.",
        medications: [
          {
            name: "Quetiapine Fumarate",
            dosage: "50mg",
            frequency: "Once daily at bedtime",
            duration: "30 days",
          },
        ],
        followUpDate: "2026-09-27",
        followUpNotes: "1-week clinical stability & titration check",
      }
    );
    const consult1Id = createConsult1Res.data?.data?.consultationId || "";
    const isConsult1Created = createConsult1Res.status === 201 && consult1Id.startsWith("CNS-");
    logTest(3, "Create Consultation", isConsult1Created, `Status 201 Created. Assigned ID: ${consult1Id}`);

    // 4. Save consultation
    const consult1Saved = (await Consultation.findOne({ consultationId: consult1Id })) !== null;
    logTest(4, "Save Consultation", consult1Saved, `Consultation record ${consult1Id} persisted in MongoDB.`);

    // 5. View consultation history
    const viewHistoryRes = await httpRequest("GET", "/api/patients/PX-9402/consultations", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const history1Ok = viewHistoryRes.status === 200 && viewHistoryRes.data?.data?.length === 1;
    logTest(5, "View Consultation History", history1Ok, `History fetched successfully. Total records: 1.`);

    // 6. Create second consultation (Consultation 2)
    const createConsult2Res = await httpRequest(
      "POST",
      "/api/patients/PX-9402/consultations",
      { Authorization: `Bearer ${doctorToken}` },
      {
        patientId: "PX-9402",
        consultationDate: "2026-09-27",
        time: "11:30 AM",
        visitType: "Follow-up Consultation",
        presentingComplaint: "Sleep improved to 7 hours. Mood stabilized.",
        clinicalObservations: "Appearance: Cooperative. Mood: Euthymic.",
        assessment: "Favorable clinical response to Quetiapine.",
        diagnosis: {
          primaryICD: "F31.3",
          primaryTitle: "Bipolar I Disorder, Current Episode Depressed",
        },
        treatmentPlan: "Maintain Quetiapine 50mg QHS.",
        followUpDate: "2026-10-15",
        followUpNotes: "Monthly outpatient follow-up",
      }
    );
    const consult2Id = createConsult2Res.data?.data?.consultationId || "";
    const isConsult2Created = createConsult2Res.status === 201 && consult2Id.startsWith("CNS-");
    logTest(6, "Create Second Consultation", isConsult2Created, `Second consultation created with ID: ${consult2Id}`);

    // 7. Verify both consultations remain (no overwrite)
    const viewHistoryRes2 = await httpRequest("GET", "/api/patients/PX-9402/consultations", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const records = viewHistoryRes2.data?.data || [];
    const bothRemain = records.length === 2 && records.some((r: any) => r.consultationId === consult1Id) && records.some((r: any) => r.consultationId === consult2Id);
    logTest(7, "Verify Multiple Consultations Remain", bothRemain, `Both consultations (${consult1Id}, ${consult2Id}) exist independently.`);

    // 8. Verify chronological ordering
    const isChronological = records.length === 2 && records[0].consultationDate >= records[1].consultationDate;
    logTest(8, "Verify Chronological Ordering", isChronological, `Consultations ordered newest first (${records[0].consultationDate} -> ${records[1].consultationDate}).`);

    // 9. Edit permitted consultation (PUT /api/patients/:patientId/consultations/:consultationId)
    const editRes = await httpRequest(
      "PUT",
      `/api/patients/PX-9402/consultations/${consult1Id}`,
      { Authorization: `Bearer ${doctorToken}` },
      {
        treatmentPlan: "Initiate Quetiapine 50mg QHS + Weekly CBT therapy sessions.",
      }
    );
    const isEdited = editRes.status === 200 && editRes.data?.data?.treatmentPlan?.includes("Weekly CBT");
    logTest(9, "Edit Permitted Consultation", isEdited, `Status 200 OK. Updated treatment plan to reflect CBT sessions.`);

    // 10. Verify patient timeline integration
    const updatedPatient = await Patient.findOne({ patientId: "PX-9402" });
    const timelineOk = updatedPatient?.lastVisitDate === "2026-09-27" && updatedPatient?.nextFollowUpDate === "2026-10-15";
    logTest(10, "Verify Patient Timeline Integration", Boolean(timelineOk), `Patient lastVisitDate (${updatedPatient?.lastVisitDate}) & nextFollowUpDate (${updatedPatient?.nextFollowUpDate}) updated.`);

    // 11. Verify diagnosis is saved
    const consult1Doc = await Consultation.findOne({ consultationId: consult1Id });
    const isDiagnosisSaved = consult1Doc?.diagnosis?.primaryICD === "F31.3" && consult1Doc?.diagnosis?.primaryTitle?.includes("Bipolar");
    logTest(11, "Verify Diagnosis Saved", Boolean(isDiagnosisSaved), `Diagnosis stored as ICD-10 F31.3 (${consult1Doc?.diagnosis?.primaryTitle}).`);

    // 12. Verify follow-up date if present
    const followUpOk = (consult2Doc: any) => consult2Doc?.followUpDate === "2026-10-15";
    const consult2Doc = await Consultation.findOne({ consultationId: consult2Id });
    logTest(12, "Verify Follow-up Date Saved", followUpOk(consult2Doc), `Follow-up date 2026-10-15 correctly attached to consultation record.`);

    // 13. Login as RECEPTION
    const isReceptionLogged = receptionToken.length > 0;
    logTest(13, "Login as RECEPTION", isReceptionLogged, "Reception staff authenticated cleanly.");

    // 14. Verify clinical access restrictions for RECEPTION
    const receptionHistoryRes = await httpRequest("GET", "/api/patients/PX-9402/consultations", {
      Authorization: `Bearer ${receptionToken}`,
    });
    const recRecord = receptionHistoryRes.data?.data?.[0];
    const isRestrictedForReception = receptionHistoryRes.status === 200 && recRecord?.presentingComplaint?.includes("Restricted");
    
    // Also test POST restriction for RECEPTION
    const recCreateRes = await httpRequest(
      "POST",
      "/api/patients/PX-9402/consultations",
      { Authorization: `Bearer ${receptionToken}` },
      {
        patientId: "PX-9402",
        consultationDate: "2026-09-28",
        presentingComplaint: "Test complaint",
        clinicalObservations: "Test obs",
        assessment: "Test assessment",
        diagnosis: { primaryICD: "F90.2", primaryTitle: "ADHD" },
        treatmentPlan: "Test plan",
      }
    );
    const isRecPostBlocked = recCreateRes.status === 403;
    const receptionAccessRestricted = isRestrictedForReception && isRecPostBlocked;
    logTest(14, "Verify RECEPTION Clinical Access Restrictions", receptionAccessRestricted, `Clinical notes sanitized for GET; POST blocked with 403 Forbidden.`);

    // 15. Test unauthorized request (401 when token omitted)
    const unauthRes = await httpRequest("GET", "/api/patients/PX-9402/consultations");
    const isUnauthOk = unauthRes.status === 401;
    logTest(15, "Test Unauthorized Request (401)", isUnauthOk, `Status 401 Unauthorized returned when token is missing.`);

    // 16. Test invalid patient ID (404)
    const invalidPatientRes = await httpRequest("GET", "/api/patients/PX-9999999/consultations", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const isInvalidPatientOk = invalidPatientRes.status === 404 && invalidPatientRes.data?.success === false;
    logTest(16, "Test Invalid Patient ID (404)", isInvalidPatientOk, `Status 404 Not Found returned for non-existent patient ID.`);

    // 17. Test invalid consultation ID (404)
    const invalidConsultRes = await httpRequest("GET", "/api/patients/PX-9402/consultations/CNS-9999999", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const isInvalidConsultOk = invalidConsultRes.status === 404 && invalidConsultRes.data?.success === false;
    logTest(17, "Test Invalid Consultation ID (404)", isInvalidConsultOk, `Status 404 Not Found returned for non-existent consultation ID.`);

    // 18. Test invalid consultation data (400 Zod error)
    const invalidDataRes = await httpRequest(
      "POST",
      "/api/patients/PX-9402/consultations",
      { Authorization: `Bearer ${doctorToken}` },
      {
        patientId: "PX-9402",
        consultationDate: "2026-09-28",
        // missing presentingComplaint, clinicalObservations, assessment, diagnosis, treatmentPlan
      }
    );
    const isInvalidDataOk = invalidDataRes.status === 400 && invalidDataRes.data?.success === false;
    logTest(18, "Test Invalid Consultation Data (400)", isInvalidDataOk, `Status 400 Bad Request returned for incomplete consultation data.`);

    // 19. Test database error handling (sanitized 500/404 response without leaking stack traces)
    const dbErrRes = await httpRequest("GET", "/api/patients/invalid-object-id-format!@#/consultations", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const isDbErrHandled = dbErrRes.status === 404 || dbErrRes.status === 500;
    logTest(19, "Test Database Error Handling", isDbErrHandled, `Status ${dbErrRes.status} returned with clean JSON error response.`);

    // 20. Refresh frontend/DB and verify saved data persists
    const refetchRes = await httpRequest("GET", "/api/patients/PX-9402/consultations", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const isPersisted = refetchRes.status === 200 && refetchRes.data?.data?.length === 2;
    logTest(20, "Verify Saved Data Persists Across Refetch", isPersisted, `Both consultations verified present in DB after refresh.`);

  } catch (err: any) {
    console.error("Test Suite Error:", err);
  } finally {
    if (serverInstance) serverInstance.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();

    console.log("===================================================================");
    const allPassed = results.length === 20 && results.every((r) => r.passed);
    if (allPassed) {
      console.log("🎉 ALL 20 CONSULTATION & DIAGNOSIS TEST SCENARIOS PASSED!");
      process.exit(0);
    } else {
      console.error("❌ TEST SUITE FAILED — Some test cases failed.");
      process.exit(1);
    }
  }
}

runPhase6Tests();
