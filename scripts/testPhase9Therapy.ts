import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import User from '../models/User';
import Patient from '../models/Patient';
import TherapySession from '../models/TherapySession';
import authRoutes from '../backend/routes/authRoutes';
import patientRoutes from '../backend/routes/patientRoutes';
import therapyRoutes from '../backend/routes/therapyRoutes';
import { notFoundHandler, errorHandler } from '../backend/middleware/errorMiddleware';

async function runPhase9Tests() {
  console.log('====================================================');
  console.log('   STARTING PHASE 9 — PSYCHOTHERAPY MODULE TESTS    ');
  console.log('====================================================\n');

  let mongoServer: MongoMemoryServer | undefined;
  let server: any;
  const PORT = 5009;
  const API_BASE = `http://localhost:${PORT}/api`;

  try {
    // 1. Spin up MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[TEST SETUP] MongoMemoryServer connected.');

    // 2. Setup Express Test App
    const app = express();
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/patients', patientRoutes);
    app.use('/api/therapy-sessions', therapyRoutes);
    app.use('/api/therapy', therapyRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`[TEST SETUP] Express test server listening on port ${PORT}.\n`);
        resolve();
      });
    });

    // 3. Seed Users & Patients
    const doctorUser = new User({
      userId: 'USR-001',
      name: 'DR SHAHAB MUHAMMAD',
      email: 'dr.vance@vancepsychiatry.com',
      passwordHash: 'Vance2026!',
      role: 'DOCTOR',
      isActive: true,
      permissions: { canWriteClinicalNotes: true, canPrescribe: true, canManagePatients: true, canManageAppointments: true, canManageUsers: false, canViewReports: true }
    });
    await doctorUser.save();

    const therapistUser = new User({
      userId: 'USR-003',
      name: 'Dr. Emily Watson, PsyD',
      email: 'e.watson@vancepsychiatry.com',
      passwordHash: 'Vance2026!',
      role: 'THERAPIST',
      isActive: true,
      permissions: { canWriteClinicalNotes: true, canPrescribe: false, canManagePatients: true, canManageAppointments: true, canManageUsers: false, canViewReports: true }
    });
    await therapistUser.save();

    const receptionUser = new User({
      userId: 'USR-002',
      name: 'Sarah Jenkins',
      email: 's.jenkins@vancepsychiatry.com',
      passwordHash: 'Vance2026!',
      role: 'RECEPTION',
      isActive: true,
      permissions: { canWriteClinicalNotes: false, canPrescribe: false, canManagePatients: true, canManageAppointments: true, canManageUsers: false, canViewReports: false }
    });
    await receptionUser.save();

    const testPatient = new Patient({
      patientId: 'PX-9402',
      fullName: 'Eleanor Vance',
      dateOfBirth: '1991-04-12',
      age: 35,
      gender: 'Female',
      phone: '+1 (555) 234-5678',
      email: 'eleanor.vance@example.com',
      address: '742 Evergreen Terrace',
      status: 'Active',
      registeredDate: '2026-01-15',
      isActive: true,
    });
    await testPatient.save();

    const testPatient2 = new Patient({
      patientId: 'PX-9405',
      fullName: 'Arthur Pendelton',
      dateOfBirth: '1985-09-20',
      age: 41,
      gender: 'Male',
      phone: '+1 (555) 987-6543',
      email: 'arthur.p@example.com',
      address: '10 Downing Street',
      status: 'Active',
      registeredDate: '2026-02-10',
      isActive: true,
    });
    await testPatient2.save();

    console.log('[TEST SETUP] Users and patients seeded successfully.\n');

    // -------------------------------------------------------------
    // STEP 1: Login as DOCTOR
    // -------------------------------------------------------------
    console.log('--- TEST 1: Login as DOCTOR ---');
    const doctorLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.vance@vancepsychiatry.com', password: 'Vance2026!' }),
    });
    const doctorLoginData = await doctorLoginRes.json();
    console.log('Doctor Login Status:', doctorLoginRes.status, '| Success:', doctorLoginData.success);
    if (!doctorLoginData.token) throw new Error('Doctor login failed.');
    const doctorToken = doctorLoginData.token;
    console.log('✓ STEP 1 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 2: Open patient
    // -------------------------------------------------------------
    console.log('--- TEST 2: Open patient PX-9402 ---');
    const getPatientRes = await fetch(`${API_BASE}/patients/PX-9402`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const getPatientData = await getPatientRes.json();
    console.log('Get Patient Status:', getPatientRes.status, '| Patient Name:', getPatientData.data?.fullName);
    if (getPatientRes.status !== 200 || getPatientData.data?.patientId !== 'PX-9402') {
      throw new Error('Could not open patient PX-9402.');
    }
    console.log('✓ STEP 2 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 3 & 4: Create psychotherapy session & Save session
    // -------------------------------------------------------------
    console.log('--- TEST 3 & 4: Create & Save Psychotherapy Session 1 ---');
    const session1Payload = {
      patientId: 'PX-9402',
      sessionDate: '2026-09-20',
      durationMinutes: 60,
      sessionType: 'CBT',
      assessment: 'Patient presented with moderate affective distress and cognitive catastrophizing.',
      counselling: 'Reviewed cognitive distortions and guided Socratic dialogue.',
      intervention: 'Practiced 2-column thought restructuring log and 4-7-8 breathing.',
      progressNotes: 'Patient engaged actively with good behavioral insight.',
      psychometrics: 'GAD-7: 9 (Mild) • PHQ-9: 8 (Mild)',
      lifestyleInterventions: 'Daily 15-min morning walk, sleep onset at 11:00 PM.',
      followUpPlan: 'Weekly CBT session. Review homework log.',
      responsibleClinician: 'DR SHAHAB MUHAMMAD',
      status: 'Completed',
    };

    const createSession1Res = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify(session1Payload),
    });
    const createSession1Data = await createSession1Res.json();
    console.log('Create Session 1 Status:', createSession1Res.status, '| Session ID:', createSession1Data.data?.sessionId);
    if (createSession1Res.status !== 201 || !createSession1Data.data?.sessionId) {
      throw new Error('Failed to create psychotherapy session 1.');
    }
    const session1Id = createSession1Data.data.sessionId;
    console.log('✓ STEPS 3 & 4 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 5: View session history
    // -------------------------------------------------------------
    console.log('--- TEST 5: View Session History for Patient ---');
    const historyRes1 = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const historyData1 = await historyRes1.json();
    console.log('History Status:', historyRes1.status, '| Count:', historyData1.count);
    if (historyRes1.status !== 200 || historyData1.count !== 1) {
      throw new Error('Session history failed to reflect session 1.');
    }
    console.log('✓ STEP 5 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 6: Create second session
    // -------------------------------------------------------------
    console.log('--- TEST 6: Create Psychotherapy Session 2 ---');
    const session2Payload = {
      patientId: 'PX-9402',
      sessionDate: '2026-09-27',
      durationMinutes: 50,
      sessionType: 'Exposure & Response Prevention (ERP)',
      assessment: 'Follow-up on anxiety triggers and compulsive checking.',
      counselling: 'Psychoeducation on ERP hierarchy and habituation curve.',
      intervention: 'In-session ERP exercise: resisted checking phone notifications for 20 mins.',
      progressNotes: 'Anxiety peak dropped from 8/10 to 3/10 after 15 minutes.',
      psychometrics: 'Y-BOCS: 12 (Mild)',
      lifestyleInterventions: 'Maintain ERP homework log twice daily.',
      followUpPlan: 'Bi-weekly ERP session.',
      responsibleClinician: 'DR SHAHAB MUHAMMAD',
      status: 'Completed',
    };

    const createSession2Res = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify(session2Payload),
    });
    const createSession2Data = await createSession2Res.json();
    console.log('Create Session 2 Status:', createSession2Res.status, '| Session ID:', createSession2Data.data?.sessionId);
    if (createSession2Res.status !== 201 || !createSession2Data.data?.sessionId) {
      throw new Error('Failed to create psychotherapy session 2.');
    }
    const session2Id = createSession2Data.data.sessionId;
    console.log('✓ STEP 6 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 7: Verify both sessions remain
    // -------------------------------------------------------------
    console.log('--- TEST 7: Verify Both Sessions Remain Accessible ---');
    const historyRes2 = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const historyData2 = await historyRes2.json();
    console.log('History Count:', historyData2.count);
    if (historyData2.count < 2) {
      throw new Error('Historical sessions were overwritten! Expected at least 2 sessions.');
    }
    console.log('✓ STEP 7 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 8: Verify chronological ordering
    // -------------------------------------------------------------
    console.log('--- TEST 8: Verify Chronological Ordering (Newest First) ---');
    const date1 = new Date(historyData2.data[0].sessionDate).getTime();
    const date2 = new Date(historyData2.data[1].sessionDate).getTime();
    console.log('Session 0 Date:', historyData2.data[0].sessionDate, '| Session 1 Date:', historyData2.data[1].sessionDate);
    if (date1 < date2) {
      throw new Error('Sessions are not in chronological order (newest first).');
    }
    console.log('✓ STEP 8 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 9: Edit authorized session
    // -------------------------------------------------------------
    console.log('--- TEST 9: Edit Authorized Session ---');
    const updateRes = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions/${session1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ progressNotes: 'Updated progress notes: Patient demonstrated outstanding CBT homework compliance.' }),
    });
    const updateData = await updateRes.json();
    console.log('Update Status:', updateRes.status, '| Updated Progress Notes:', updateData.data?.progressNotes);
    if (updateRes.status !== 200 || !updateData.data?.progressNotes.includes('outstanding CBT homework')) {
      throw new Error('Failed to edit authorized session.');
    }
    console.log('✓ STEP 9 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 10: Verify patient timeline / session fetch
    // -------------------------------------------------------------
    console.log('--- TEST 10: Verify Patient Session Retrieval for Timeline ---');
    const timelineRes = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions/${session1Id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const timelineData = await timelineRes.json();
    console.log('Single Session Fetch Status:', timelineRes.status, '| Session ID:', timelineData.data?.id);
    if (timelineRes.status !== 200 || timelineData.data?.id !== session1Id) {
      throw new Error('Failed to retrieve single session for timeline event.');
    }
    console.log('✓ STEP 10 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 11: Login as THERAPIST
    // -------------------------------------------------------------
    console.log('--- TEST 11: Login as THERAPIST ---');
    const therapistLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'e.watson@vancepsychiatry.com', password: 'Vance2026!' }),
    });
    const therapistLoginData = await therapistLoginRes.json();
    console.log('Therapist Login Status:', therapistLoginRes.status, '| Success:', therapistLoginData.success);
    if (!therapistLoginData.token) throw new Error('Therapist login failed.');
    const therapistToken = therapistLoginData.token;
    console.log('✓ STEP 11 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 12: Test assigned-patient access (Therapist creates session)
    // -------------------------------------------------------------
    console.log('--- TEST 12: Test Assigned-Patient Access for THERAPIST ---');
    const therapistSessionPayload = {
      patientId: 'PX-9405',
      sessionDate: '2026-09-22',
      durationMinutes: 50,
      sessionType: 'Supportive Psychotherapy',
      assessment: 'Therapist assessment of grief reaction and adjustment symptoms.',
      counselling: 'Empathic active listening and emotional validation.',
      intervention: 'Grounding techniques and supportive journaling assignment.',
      progressNotes: 'Patient expressed relief during therapeutic discharge.',
      psychometrics: 'PHQ-9: 10 (Moderate)',
      lifestyleInterventions: 'Maintain daily mood and sleep log.',
      followUpPlan: 'Weekly supportive therapy.',
      therapistId: 'USR-003',
      therapistName: 'Dr. Emily Watson, PsyD',
      responsibleClinician: 'Dr. Emily Watson, PsyD',
      status: 'Completed',
    };

    const therapistCreateRes = await fetch(`${API_BASE}/patients/PX-9405/therapy-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${therapistToken}` },
      body: JSON.stringify(therapistSessionPayload),
    });
    const therapistCreateData = await therapistCreateRes.json();
    console.log('Therapist Create Session Status:', therapistCreateRes.status, '| Session ID:', therapistCreateData.data?.sessionId);
    if (therapistCreateRes.status !== 201 || !therapistCreateData.data?.sessionId) {
      throw new Error('Therapist failed to create session for assigned patient.');
    }
    const therapistSessionId = therapistCreateData.data.sessionId;
    console.log('✓ STEP 12 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 13: Test unauthorized patient access (Therapist editing unassigned session)
    // -------------------------------------------------------------
    console.log('--- TEST 13: Test Unauthorized Patient Access for THERAPIST ---');
    // Attempting to edit Doctor's session (session1Id) with therapistId of another user or unassigned
    const unauthorizedUpdateRes = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions/${session1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${therapistToken}` },
      body: JSON.stringify({ progressNotes: 'Unauthorized edit attempt by therapist.' }),
    });
    const unauthorizedUpdateData = await unauthorizedUpdateRes.json();
    console.log('Unauthorized Edit Status:', unauthorizedUpdateRes.status, '| Error:', unauthorizedUpdateData.error);
    if (unauthorizedUpdateRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for unauthorized therapist edit, got ${unauthorizedUpdateRes.status}`);
    }
    console.log('✓ STEP 13 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 14: Login as RECEPTION
    // -------------------------------------------------------------
    console.log('--- TEST 14: Login as RECEPTION ---');
    const receptionLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 's.jenkins@vancepsychiatry.com', password: 'Vance2026!' }),
    });
    const receptionLoginData = await receptionLoginRes.json();
    console.log('Reception Login Status:', receptionLoginRes.status, '| Success:', receptionLoginData.success);
    if (!receptionLoginData.token) throw new Error('Reception login failed.');
    const receptionToken = receptionLoginData.token;
    console.log('✓ STEP 14 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 15: Verify psychotherapy notes are restricted for RECEPTION
    // -------------------------------------------------------------
    console.log('--- TEST 15: Verify Psychotherapy Notes Restricted for RECEPTION ---');
    // 15a. GET sessions as Reception -> clinical notes should be redacted
    const receptionGetRes = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions`, {
      headers: { Authorization: `Bearer ${receptionToken}` },
    });
    const receptionGetData = await receptionGetRes.json();
    console.log('Reception GET Status:', receptionGetRes.status, '| Redacted Assessment:', receptionGetData.data?.[0]?.assessment);
    if (receptionGetRes.status !== 200 || !receptionGetData.data?.[0]?.assessment.includes('[REDACTED')) {
      throw new Error('Sensitive therapy notes were not redacted for Reception GET request!');
    }

    // 15b. POST session as Reception -> HTTP 403 Forbidden
    const receptionPostRes = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify(session1Payload),
    });
    const receptionPostData = await receptionPostRes.json();
    console.log('Reception POST Status:', receptionPostRes.status, '| Error:', receptionPostData.error);
    if (receptionPostRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for Reception POST, got ${receptionPostRes.status}`);
    }
    console.log('✓ STEP 15 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 16: Test unauthenticated request
    // -------------------------------------------------------------
    console.log('--- TEST 16: Test Unauthenticated Request ---');
    const unauthRes = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions`);
    const unauthData = await unauthRes.json();
    console.log('Unauth GET Status:', unauthRes.status, '| Error:', unauthData.error);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log('✓ STEP 16 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 17: Test invalid patient ID
    // -------------------------------------------------------------
    console.log('--- TEST 17: Test Invalid Patient ID ---');
    const invalidPatientRes = await fetch(`${API_BASE}/patients/PX-999999/therapy-sessions`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const invalidPatientData = await invalidPatientRes.json();
    console.log('Invalid Patient GET Status:', invalidPatientRes.status, '| Error:', invalidPatientData.error);
    if (invalidPatientRes.status !== 404) {
      throw new Error(`Expected HTTP 404 Not Found for invalid patient ID, got ${invalidPatientRes.status}`);
    }
    console.log('✓ STEP 17 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 18: Test invalid session ID
    // -------------------------------------------------------------
    console.log('--- TEST 18: Test Invalid Session ID ---');
    const invalidSessionRes = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions/TS-999999`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const invalidSessionData = await invalidSessionRes.json();
    console.log('Invalid Session GET Status:', invalidSessionRes.status, '| Error:', invalidSessionData.error);
    if (invalidSessionRes.status !== 404) {
      throw new Error(`Expected HTTP 404 Not Found for invalid session ID, got ${invalidSessionRes.status}`);
    }
    console.log('✓ STEP 18 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 19: Test invalid session data (Validation error)
    // -------------------------------------------------------------
    console.log('--- TEST 19: Test Invalid Session Data (Validation Error) ---');
    const invalidDataPayload = {
      patientId: 'PX-9402',
      sessionDate: '', // Invalid empty date
      durationMinutes: -10, // Invalid negative duration
      sessionType: 'CBT',
    };

    const invalidDataRes = await fetch(`${API_BASE}/patients/PX-9402/therapy-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify(invalidDataPayload),
    });
    const invalidDataJson = await invalidDataRes.json();
    console.log('Invalid Data Status:', invalidDataRes.status, '| Error:', invalidDataJson.error);
    if (invalidDataRes.status !== 400) {
      throw new Error(`Expected HTTP 400 Bad Request for invalid session data, got ${invalidDataRes.status}`);
    }
    console.log('✓ STEP 19 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 20: Test database error handling
    // -------------------------------------------------------------
    console.log('--- TEST 20: Test Database Error Handling ---');
    // Verify endpoints handle requests safely and return JSON responses without raw database crashes
    const safeErrRes = await fetch(`${API_BASE}/therapy-sessions/invalid_object_id_string`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const safeErrJson = await safeErrRes.json();
    console.log('Database Error Handling Status:', safeErrRes.status, '| Success:', safeErrJson.success);
    if (typeof safeErrJson.success !== 'boolean') {
      throw new Error('Database error handling did not return clean JSON object.');
    }
    console.log('✓ STEP 20 PASSED.\n');

    // -------------------------------------------------------------
    // STEP 21: Refresh frontend / refetch data persistence check
    // -------------------------------------------------------------
    console.log('--- TEST 21: Refresh & Verify Persistence in MongoDB ---');
    const mongoCount = await TherapySession.countDocuments();
    const fetchedDoc = await TherapySession.findOne({ sessionId: session1Id });
    console.log('MongoDB Therapy Session Count:', mongoCount);
    console.log('Fetched Document Session ID:', fetchedDoc?.sessionId, '| Clinician:', fetchedDoc?.responsibleClinician);
    if (mongoCount < 3 || fetchedDoc?.sessionId !== session1Id) {
      throw new Error('Therapy sessions were not persisted in MongoDB!');
    }
    console.log('✓ STEP 21 PASSED.\n');

    console.log('====================================================');
    console.log('  ALL 21 PHASE 9 INTEGRATION TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('\n❌ PHASE 9 TEST FAILED:', err.message || err);
    process.exit(1);
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  }
}

runPhase9Tests();
