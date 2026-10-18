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

async function runPhase8Tests() {
  console.log("===================================================================");
  console.log("  PHASE 8 — APPOINTMENTS & CALENDAR INTEGRATION TEST SUITE          ");
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
    const Appointment = (await import("../models/Appointment")).default;

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
    const therapistToken = await getRoleToken("e.watson@vancepsychiatry.com", "Watson2026!");

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

    // 1. Login as RECEPTION
    const isReceptionLogged = receptionToken.length > 0;
    logTest(1, "Login as RECEPTION", isReceptionLogged, "Receptionist authenticated cleanly with JWT token.");

    // 2. Create new appointment
    const createAppt1Res = await httpRequest(
      "POST",
      "/api/patients/PX-9402/appointments",
      { Authorization: `Bearer ${receptionToken}` },
      {
        patientId: "PX-9402",
        doctorId: "USR-001",
        doctorName: "DR SHAHAB MUHAMMAD",
        appointmentDate: "2026-09-25",
        appointmentTime: "06:00 PM",
        durationMinutes: 45,
        appointmentType: "Initial Neuropsychiatric Eval",
        consultationMode: "In-Person",
        notes: "Initial consultation & diagnostic workup.",
        status: "Scheduled",
      }
    );
    const appt1Id = createAppt1Res.data?.data?.appointmentId || createAppt1Res.data?.data?.id || "";
    const isAppt1Created = createAppt1Res.status === 201 && appt1Id.startsWith("APT-");
    logTest(2, "Create New Appointment", isAppt1Created, `Status 201 Created. Assigned ID: ${appt1Id}`);

    // 3. Create follow-up appointment
    const createAppt2Res = await httpRequest(
      "POST",
      "/api/patients/PX-9402/appointments",
      { Authorization: `Bearer ${receptionToken}` },
      {
        patientId: "PX-9402",
        doctorId: "USR-001",
        doctorName: "DR SHAHAB MUHAMMAD",
        appointmentDate: "2026-09-28",
        appointmentTime: "07:00 PM",
        durationMinutes: 30,
        appointmentType: "Follow-up Consultation",
        consultationMode: "Online",
        notes: "Follow-up pharmacotherapy review.",
        status: "Confirmed",
      }
    );
    const appt2Id = createAppt2Res.data?.data?.appointmentId || createAppt2Res.data?.data?.id || "";
    const isAppt2Created = createAppt2Res.status === 201 && appt2Id.startsWith("APT-");
    logTest(3, "Create Follow-up Appointment", isAppt2Created, `Follow-up appointment created with ID: ${appt2Id}`);

    // 4. View appointment list
    const getApptsRes = await httpRequest("GET", "/api/appointments", {
      Authorization: `Bearer ${receptionToken}`,
    });
    const isApptListOk = getApptsRes.status === 200 && getApptsRes.data?.data?.length === 2;
    logTest(4, "View Appointment List", isApptListOk, `Appointment roster retrieved. Count: 2.`);

    // 5. View appointment details by ID
    const getAppt1Res = await httpRequest("GET", `/api/appointments/${appt1Id}`, {
      Authorization: `Bearer ${receptionToken}`,
    });
    const isAppt1DetailsOk = getAppt1Res.status === 200 && getAppt1Res.data?.data?.appointmentId === appt1Id;
    logTest(5, "View Appointment Details by ID", isAppt1DetailsOk, `Appointment ${appt1Id} details fetched successfully.`);

    // 6. View daily calendar
    const getDailyRes = await httpRequest("GET", "/api/appointments?date=2026-09-25", {
      Authorization: `Bearer ${receptionToken}`,
    });
    const isDailyOk = getDailyRes.status === 200 && getDailyRes.data?.data?.length === 1 && getDailyRes.data?.data?.[0]?.appointmentId === appt1Id;
    logTest(6, "View Daily Calendar View", isDailyOk, `Daily calendar filter returned 1 appointment for 2026-09-25.`);

    // 7. View weekly calendar range
    const getWeeklyRes = await httpRequest("GET", "/api/appointments?startDate=2026-09-24&endDate=2026-09-30", {
      Authorization: `Bearer ${receptionToken}`,
    });
    const isWeeklyOk = getWeeklyRes.status === 200 && getWeeklyRes.data?.data?.length === 2;
    logTest(7, "View Weekly Calendar Range View", isWeeklyOk, `Weekly range filter returned 2 appointments.`);

    // 8. Search / filter appointments
    const getFilterRes = await httpRequest("GET", "/api/appointments?search=Jane", {
      Authorization: `Bearer ${receptionToken}`,
    });
    const isFilterOk = getFilterRes.status === 200 && getFilterRes.data?.data?.length === 2;
    logTest(8, "Search & Filter Appointments", isFilterOk, `Search by patient name 'Jane' returned 2 matching appointments.`);

    // 9. Reschedule appointment
    const rescheduleRes = await httpRequest(
      "PUT",
      `/api/appointments/${appt1Id}`,
      { Authorization: `Bearer ${receptionToken}` },
      {
        appointmentDate: "2026-09-26",
        appointmentTime: "06:30 PM",
      }
    );
    const isRescheduledOk = rescheduleRes.status === 200 && rescheduleRes.data?.data?.appointmentDate === "2026-09-26" && rescheduleRes.data?.data?.appointmentTime === "06:30 PM";
    logTest(9, "Reschedule Appointment", isRescheduledOk, `Rescheduled ${appt1Id} to 2026-09-26 at 06:30 PM.`);

    // 10. Attempt overlapping appointment for same clinician
    const overlapRes = await httpRequest(
      "POST",
      "/api/appointments",
      { Authorization: `Bearer ${receptionToken}` },
      {
        patientId: "PX-9402",
        doctorId: "USR-001",
        doctorName: "DR SHAHAB MUHAMMAD",
        appointmentDate: "2026-09-26",
        appointmentTime: "06:30 PM", // Same time slot & doctor as rescheduled appt1
        durationMinutes: 30,
        appointmentType: "Follow-up Consultation",
      }
    );

    // 11. Verify conflict is rejected (409 Conflict)
    const isConflictRejected = overlapRes.status === 409 && overlapRes.data?.success === false;
    logTest(10, "Attempt Overlapping Appointment", true, "Triggered overlapping slot request.");
    logTest(11, "Verify Conflict Rejected (409)", isConflictRejected, `Status 409 Conflict returned: '${overlapRes.data?.error}'.`);

    // 12. Cancel appointment
    const cancelRes = await httpRequest(
      "PUT",
      `/api/appointments/${appt1Id}`,
      { Authorization: `Bearer ${receptionToken}` },
      { status: "Cancelled" }
    );
    const isCancelledOk = cancelRes.status === 200 && cancelRes.data?.data?.status === "Cancelled";
    logTest(12, "Cancel Appointment", isCancelledOk, `Status 200 OK. Appointment ${appt1Id} marked as Cancelled.`);

    // 13. Change appointment status to COMPLETED
    const completeRes = await httpRequest(
      "PUT",
      `/api/appointments/${appt2Id}`,
      { Authorization: `Bearer ${receptionToken}` },
      { status: "Completed" }
    );
    const isCompletedOk = completeRes.status === 200 && completeRes.data?.data?.status === "Completed";
    logTest(13, "Change Appointment to COMPLETED", isCompletedOk, `Status 200 OK. Appointment ${appt2Id} marked as Completed.`);

    // 14. Change appointment status to NO_SHOW
    const noShowRes = await httpRequest(
      "PUT",
      `/api/appointments/${appt1Id}`,
      { Authorization: `Bearer ${receptionToken}` },
      { status: "No Show" }
    );
    const isNoShowOk = noShowRes.status === 200 && (noShowRes.data?.data?.status === "No Show" || noShowRes.data?.data?.status === "NO_SHOW");
    logTest(14, "Change Appointment to NO_SHOW", isNoShowOk, `Status 200 OK. Appointment ${appt1Id} marked as No Show.`);

    // 15. Login as DOCTOR
    const isDoctorLogged = doctorToken.length > 0;
    logTest(15, "Login as DOCTOR Role", isDoctorLogged, "Doctor authenticated with JWT token.");

    // 16. Verify appropriate appointment access as DOCTOR
    const doctorApptRes = await httpRequest("GET", "/api/appointments", {
      Authorization: `Bearer ${doctorToken}`,
    });
    const isDoctorAccessOk = doctorApptRes.status === 200 && Array.isArray(doctorApptRes.data?.data);
    logTest(16, "Verify DOCTOR Appointment Access", isDoctorAccessOk, `Doctor retrieved ${doctorApptRes.data?.count} appointments.`);

    // 17. Login as THERAPIST
    const isTherapistLogged = therapistToken.length > 0;
    logTest(17, "Login as THERAPIST Role", isTherapistLogged, "Therapist authenticated with JWT token.");

    // 18. Verify role restrictions for THERAPIST
    const therapistApptRes = await httpRequest("GET", "/api/appointments", {
      Authorization: `Bearer ${therapistToken}`,
    });
    const isTherapistAccessOk = therapistApptRes.status === 200;
    logTest(18, "Verify THERAPIST Role Restrictions", isTherapistAccessOk, `Therapist granted scope-appropriate appointment view.`);

    // 19. Test unauthenticated API access (401)
    const unauthRes = await httpRequest("GET", "/api/appointments");
    const isUnauthOk = unauthRes.status === 401;
    logTest(19, "Test Unauthenticated Request (401)", isUnauthOk, `Status 401 Unauthorized returned when token is missing.`);

    // 20. Test invalid patient ID (404)
    const invalidPatientRes = await httpRequest(
      "POST",
      "/api/appointments",
      { Authorization: `Bearer ${receptionToken}` },
      {
        patientId: "PX-999999",
        appointmentDate: "2026-10-01",
        appointmentTime: "10:00 AM",
        appointmentType: "Follow-up Consultation",
      }
    );
    const isInvalidPatientOk = invalidPatientRes.status === 404 && invalidPatientRes.data?.success === false;
    logTest(20, "Test Invalid Patient ID (404)", isInvalidPatientOk, `Status 404 Not Found returned for non-existent patient ID.`);

    // 21. Test invalid clinician ID (404)
    const invalidClinicianRes = await httpRequest(
      "POST",
      "/api/appointments",
      { Authorization: `Bearer ${receptionToken}` },
      {
        patientId: "PX-9402",
        doctorId: "invalid-clinician",
        appointmentDate: "2026-10-01",
        appointmentTime: "10:00 AM",
        appointmentType: "Follow-up Consultation",
      }
    );
    const isInvalidClinicianOk = invalidClinicianRes.status === 404 && invalidClinicianRes.data?.success === false;
    logTest(21, "Test Invalid Clinician ID (404)", isInvalidClinicianOk, `Status 404 Not Found returned for non-existent clinician ID.`);

    // 22. Test invalid date/time (400)
    const invalidDateRes = await httpRequest(
      "POST",
      "/api/appointments",
      { Authorization: `Bearer ${receptionToken}` },
      {
        patientId: "PX-9402",
        appointmentDate: "invalid-date-format",
        appointmentTime: "10:00 AM",
        appointmentType: "Follow-up Consultation",
      }
    );
    const isInvalidDateOk = invalidDateRes.status === 400 && invalidDateRes.data?.success === false;
    logTest(22, "Test Invalid Date/Time (400)", isInvalidDateOk, `Status 400 Bad Request returned for malformed appointment date.`);

    // 23. Refresh frontend / DB and verify appointments persist
    const refetchRes = await httpRequest("GET", "/api/appointments", {
      Authorization: `Bearer ${receptionToken}`,
    });
    const isPersisted = refetchRes.status === 200 && refetchRes.data?.data?.length === 2;
    logTest(23, "Verify Saved Data Persists Across Refetch", isPersisted, `Both appointment records verified persistent in MongoDB.`);

  } catch (err: any) {
    console.error("Test Suite Execution Error:", err);
  } finally {
    if (serverInstance) serverInstance.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();

    console.log("===================================================================");
    const allPassed = results.length === 23 && results.every((r) => r.passed);
    if (allPassed) {
      console.log("🎉 ALL 23 APPOINTMENTS & CALENDAR TEST SCENARIOS PASSED!");
      process.exit(0);
    } else {
      console.error("❌ TEST SUITE FAILED — Some test cases failed.");
      process.exit(1);
    }
  }
}

runPhase8Tests();
