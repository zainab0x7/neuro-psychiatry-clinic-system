import express from 'express';
import http from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from '../backend/routes/authRoutes';
import userRoutes from '../backend/routes/userRoutes';
import patientRoutes from '../backend/routes/patientRoutes';
import consultationRoutes from '../backend/routes/consultationRoutes';
import prescriptionRoutes from '../backend/routes/prescriptionRoutes';
import appointmentRoutes from '../backend/routes/appointmentRoutes';
import therapyRoutes from '../backend/routes/therapyRoutes';
import { feeCategoryRouter, paymentRouter, reportRouter } from '../backend/routes/billingRoutes';
import auditRoutes from '../backend/routes/auditRoutes';
import backupRoutes from '../backend/routes/backupRoutes';
import settingsRoutes from '../backend/routes/settingsRoutes';
import healthRoutes from '../backend/routes/healthRoutes';
import { runSeed } from '../lib/seed';

let mongoServer: MongoMemoryServer;
let server: http.Server;
const PORT = 5013;
const BASE_URL = `http://localhost:${PORT}`;

async function setupTestEnvironment() {
  process.env.SKIP_SERVER_START = 'true';
  process.env.SESSION_SECRET = 'test_demo_readiness_jwt_secret_32chars_min';
  (process.env as any).NODE_ENV = 'test';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/consultations', consultationRoutes);
  app.use('/api/prescriptions', prescriptionRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/therapy-sessions', therapyRoutes);
  app.use('/api/therapy', therapyRoutes);
  app.use('/api/fee-categories', feeCategoryRouter);
  app.use('/api/payments', paymentRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/backup', backupRoutes);
  app.use('/api/settings', settingsRoutes);

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      resolve();
    });
  });
}

async function teardownTestEnvironment() {
  if (server) server.close();
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

async function runDemoReadinessTests() {
  console.log('====================================================');
  console.log('STARTING PHASE 13: CLIENT DEMO PREPARATION & DEPLOYMENT READINESS TEST SUITE');
  console.log('====================================================');

  await setupTestEnvironment();

  // 1. DEMO DATA SEEDING
  const counts = await runSeed();
  console.log('✅ Demo Data Seeded:', counts);

  // 2. DEMO ACCOUNTS AUTHENTICATION & TOKENS
  const roles = [
    { role: 'ADMIN', email: 'm.sterling@vancepsychiatry.com', pass: 'Vance2026!' },
    { role: 'DOCTOR', email: 'dr.vance@vancepsychiatry.com', pass: 'Vance2026!' },
    { role: 'RECEPTION', email: 's.jenkins@vancepsychiatry.com', pass: 'Vance2026!' },
    { role: 'THERAPIST', email: 'e.watson@vancepsychiatry.com', pass: 'Vance2026!' },
  ];

  const tokens: Record<string, string> = {};

  for (const acc of roles) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: acc.email, password: acc.pass }),
    });

    if (res.status !== 200) {
      throw new Error(`Failed to log in demo user ${acc.email}: status ${res.status}`);
    }

    const data = await res.json();
    if (!data.token) {
      throw new Error(`No JWT returned for ${acc.email}`);
    }

    tokens[acc.role] = data.token;
  }
  console.log('✅ Scenario 1 Passed: All 4 Demo Staff Accounts Logged In & Obtained JWT Tokens.');

  // TASK 9: COMPLETE 15-STEP CLIENT DEMO WORKFLOW
  console.log('\n--- TASK 9: 15-STEP CLIENT DEMO WORKFLOW ---');

  // Step 1: LOGIN (Verified above via tokens['DOCTOR'])
  console.log('✅ Step 1: Login verified.');

  // Step 2: DASHBOARD (Health & Status)
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  if (healthRes.status !== 200 || !healthData.success) {
    throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
  }
  console.log('✅ Step 2: Dashboard / Health status checked (HTTP 200 OK).');

  // Step 3: PATIENT SEARCH
  const searchRes = await fetch(`${BASE_URL}/api/patients?search=Eleanor`, {
    headers: { Authorization: `Bearer ${tokens['DOCTOR']}` },
  });
  const searchData = await searchRes.json();
  if (searchRes.status !== 200 || !searchData.data || searchData.data.length === 0) {
    throw new Error(`Patient search failed: ${JSON.stringify(searchData)}`);
  }
  const targetPatientId = searchData.data[0].patientId || searchData.data[0]._id;
  console.log(`✅ Step 3: Patient search found target patient ID: ${targetPatientId}`);

  // Step 4: OPEN PATIENT
  const openRes = await fetch(`${BASE_URL}/api/patients/${targetPatientId}`, {
    headers: { Authorization: `Bearer ${tokens['DOCTOR']}` },
  });
  if (openRes.status !== 200) {
    throw new Error(`Open patient profile failed with status ${openRes.status}`);
  }
  console.log('✅ Step 4: Open patient profile verified.');

  // Step 5: VIEW CLINICAL HISTORY
  const historyRes = await fetch(`${BASE_URL}/api/patients/${targetPatientId}/clinical-records`, {
    headers: { Authorization: `Bearer ${tokens['DOCTOR']}` },
  });
  if (historyRes.status !== 200) {
    throw new Error(`Clinical history fetch failed with status ${historyRes.status}`);
  }
  console.log('✅ Step 5: View clinical history timeline verified.');

  // Step 6 & 7: CREATE CONSULTATION & ADD DIAGNOSIS
  const consultRes = await fetch(`${BASE_URL}/api/consultations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens['DOCTOR']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      consultationId: 'CNS-DEMO-001',
      patientId: targetPatientId,
      patientName: 'Eleanor Vance-Russo (DEMO)',
      doctorId: 'USR-003',
      doctorName: 'DR SHAHAB MUHAMMAD',
      consultationDate: '2026-09-22',
      time: '10:00 AM',
      presentingComplaint: 'Severe panic attacks and anticipatory anxiety before public speaking (DEMO).',
      clinicalObservations: 'Patient is alert, cooperative, exhibiting mild hand tremor.',
      mentalStatusExam: {
        appearance: 'Well-groomed',
        behavior: 'Cooperative',
        speech: 'Normal rate',
        mood: 'Anxious',
        affect: 'Congruent',
        thoughtProcess: 'Goal-directed',
        thoughtContent: 'No delusions',
        perception: 'No hallucinations',
        cognition: 'Oriented x3',
        insight: 'Good',
        judgment: 'Intact',
      },
      assessment: 'Panic Disorder with Agoraphobia (DEMO).',
      diagnosis: {
        primaryICD: 'F41.0',
        primaryTitle: 'Panic Disorder [episodic paroxysmal anxiety] (DEMO)',
      },
      treatmentPlan: 'Initiate SSRI pharmacotherapy and cognitive behavioral therapy (CBT).',
      medications: [
        { name: 'Sertraline', dosage: '50mg', frequency: 'Once Daily', duration: '30 Days' }
      ],
      followUpDate: '2026-10-22',
    }),
  });

  if (consultRes.status !== 201 && consultRes.status !== 200) {
    const errText = await consultRes.text();
    throw new Error(`Create consultation failed (${consultRes.status}): ${errText}`);
  }
  console.log('✅ Steps 6 & 7: Create consultation & add ICD-10 diagnosis verified (CNS-DEMO-001).');

  // Step 8: CREATE PRESCRIPTION
  const rxRes = await fetch(`${BASE_URL}/api/prescriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens['DOCTOR']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prescriptionId: 'RX-DEMO-001',
      patientId: targetPatientId,
      patientName: 'Eleanor Vance-Russo (DEMO)',
      patientAge: 38,
      patientGender: 'Female',
      doctorId: 'USR-003',
      doctorName: 'DR SHAHAB MUHAMMAD',
      doctorLicense: 'NY-MED-849201',
      prescriptionDate: '2026-09-22',
      diagnosis: 'Panic Disorder (F41.0) (DEMO)',
      medications: [
        { name: 'Sertraline HCI', dosage: '50mg', frequency: 'QAM', duration: '30 days', instructions: 'Take 1 tablet after breakfast' },
        { name: 'Clonazepam', dosage: '0.25mg', frequency: 'PRN', duration: '14 days', instructions: 'Take 1 tablet PRN for acute panic' }
      ],
      treatmentPlan: 'Re-evaluate panic frequency in 4 weeks.',
      status: 'Active',
    }),
  });

  if (rxRes.status !== 201 && rxRes.status !== 200) {
    const errText = await rxRes.text();
    throw new Error(`Create prescription failed (${rxRes.status}): ${errText}`);
  }
  console.log('✅ Step 8: Create psychiatric prescription verified (RX-DEMO-001).');

  // Step 9: BOOK APPOINTMENT
  const apptRes = await fetch(`${BASE_URL}/api/appointments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens['RECEPTION']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appointmentId: 'APT-DEMO-001',
      patientId: targetPatientId,
      patientName: 'Eleanor Vance-Russo (DEMO)',
      patientPhone: '+1 (555) 234-5678',
      doctorId: 'USR-003',
      doctorName: 'DR SHAHAB MUHAMMAD',
      appointmentDate: '2026-10-22',
      appointmentTime: '11:00 AM',
      durationMinutes: 45,
      appointmentType: 'Follow-up Consultation',
      notes: 'Follow-up for SSRI tolerance and panic frequency.',
      status: 'Scheduled',
    }),
  });

  if (apptRes.status !== 201 && apptRes.status !== 200) {
    const errText = await apptRes.text();
    throw new Error(`Book appointment failed (${apptRes.status}): ${errText}`);
  }
  console.log('✅ Step 9: Book appointment verified (APT-DEMO-001).');

  // Step 10: ADD THERAPY SESSION
  const therapyRes = await fetch(`${BASE_URL}/api/therapy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens['THERAPIST']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId: 'TS-DEMO-001',
      patientId: targetPatientId,
      patientName: 'Eleanor Vance-Russo (DEMO)',
      therapistId: 'USR-004',
      therapistName: 'Dr. Emily Watson, PsyD',
      sessionDate: '2026-09-22',
      durationMinutes: 60,
      sessionType: 'Individual Psychotherapy',
      assessment: 'Initial CBT evaluation for agoraphobic avoidance.',
      counselling: 'Interoceptive exposure techniques and psychoeducation.',
      intervention: 'Diaphragmatic breathing training and cognitive restructuring.',
      progressNotes: 'Patient achieved calm baseline during in-session breathing exercise.',
      psychometrics: 'GAD-7: 14/21 (Moderate Anxiety), PHQ-9: 8/27 (Mild Depression)',
      status: 'Completed',
    }),
  });

  if (therapyRes.status !== 201 && therapyRes.status !== 200) {
    const errText = await therapyRes.text();
    throw new Error(`Add therapy session failed (${therapyRes.status}): ${errText}`);
  }
  console.log('✅ Step 10: Add therapy session verified (TS-DEMO-001).');

  // Step 11 & 12: CREATE PAYMENT & GENERATE IMMUTABLE RECEIPT
  const payRes = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens['RECEPTION']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientId: targetPatientId,
      patientName: 'Eleanor Vance-Russo (DEMO)',
      service: 'Psychiatric Evaluation & Consultation',
      amount: 250,
      paymentMethod: 'Credit Card',
      notes: 'Demo consultation fee payment',
    }),
  });

  if (payRes.status !== 201 && payRes.status !== 200) {
    const errText = await payRes.text();
    throw new Error(`Payment creation failed (${payRes.status}): ${errText}`);
  }

  const payData = await payRes.json();
  const receiptNum = payData.data ? payData.data.receiptNumber : payData.receiptNumber;
  if (!receiptNum || !receiptNum.startsWith('RCP-')) {
    throw new Error(`Invalid receipt number format generated: ${receiptNum}`);
  }
  console.log(`✅ Steps 11 & 12: Create payment & generate backend receipt verified (${receiptNum}).`);

  // Step 13: VIEW AUDIT ENTRY
  const auditRes = await fetch(`${BASE_URL}/api/audit-logs`, {
    headers: { Authorization: `Bearer ${tokens['ADMIN']}` },
  });

  if (auditRes.status !== 200) {
    throw new Error(`Audit logs fetch failed with status ${auditRes.status}`);
  }
  const auditData = await auditRes.json();
  const auditEntries = auditData.data || auditData;
  if (!Array.isArray(auditEntries) || auditEntries.length === 0) {
    throw new Error('Audit log list is empty after mutations!');
  }
  console.log(`✅ Step 13: View audit log entries verified (${auditEntries.length} audit records).`);

  // Step 14: VIEW FINANCIAL REPORT
  const reportRes = await fetch(`${BASE_URL}/api/reports/collections/daily?date=2026-09-22`, {
    headers: { Authorization: `Bearer ${tokens['ADMIN']}` },
  });

  if (reportRes.status !== 200) {
    throw new Error(`Daily collection report fetch failed with status ${reportRes.status}`);
  }
  console.log('✅ Step 14: View daily collection report verified.');

  // Step 15: EXPORT / BACKUP
  const exportRes = await fetch(`${BASE_URL}/api/backup/export`, {
    headers: { Authorization: `Bearer ${tokens['ADMIN']}` },
  });

  if (exportRes.status !== 200) {
    throw new Error(`Backup export failed with status ${exportRes.status}`);
  }
  const exportData = await exportRes.json();

  // SECURITY AUDIT ON EXPORT: Check zero password leaks
  const serializedExport = JSON.stringify(exportData);
  if (serializedExport.includes('passwordHash') || serializedExport.includes('Vance2026!')) {
    throw new Error('CRITICAL SECURITY VIOLATION: Export payload contains unhashed passwords or secrets!');
  }

  const triggerRes = await fetch(`${BASE_URL}/api/backup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['ADMIN']}` },
  });

  if (triggerRes.status !== 201 && triggerRes.status !== 200) {
    const errText = await triggerRes.text();
    throw new Error(`Trigger local backup failed with status ${triggerRes.status}: ${errText}`);
  }
  console.log('✅ Step 15: Export clinic data & trigger local backup verified (Zero password leaks).');

  // TASK 10: ROLE-BASED ACCESS CONTROL (RBAC) AUTHORIZATION CHECKS
  console.log('\n--- TASK 10: ROLE AUTHORIZATION CHECKS (403 FORBIDDEN BOUNDS) ---');

  // Doctor blocked from audit logs
  const docAudit = await fetch(`${BASE_URL}/api/audit-logs`, {
    headers: { Authorization: `Bearer ${tokens['DOCTOR']}` },
  });
  if (docAudit.status !== 403) {
    throw new Error(`Expected Doctor audit access to be 403 Forbidden, got ${docAudit.status}`);
  }
  console.log('✅ Doctor correctly blocked from accessing audit logs (403 Forbidden).');

  // Reception blocked from creating user accounts
  const recepUser = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens['RECEPTION']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: 'USR-TEST99',
      name: 'Unauth User',
      email: 'unauth@clinic.com',
      passwordHash: 'Pass123!',
      role: 'RECEPTION',
    }),
  });
  if (recepUser.status !== 403) {
    throw new Error(`Expected Reception user creation to be 403 Forbidden, got ${recepUser.status}`);
  }
  console.log('✅ Reception correctly blocked from creating user accounts (403 Forbidden).');

  // Therapist blocked from issuing prescriptions
  const therapistRx = await fetch(`${BASE_URL}/api/prescriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens['THERAPIST']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prescriptionId: 'RX-UNAUTH',
      patientId: targetPatientId,
      patientName: 'Eleanor Vance',
      patientAge: 38,
      patientGender: 'Female',
      doctorId: 'USR-005',
      doctorName: 'Dr. Emily Watson',
      prescriptionDate: '2026-09-22',
      diagnosis: 'Test',
      medications: [],
      status: 'ACTIVE',
    }),
  });
  if (therapistRx.status !== 403) {
    throw new Error(`Expected Therapist prescription creation to be 403 Forbidden, got ${therapistRx.status}`);
  }
  console.log('✅ Therapist correctly blocked from issuing medical prescriptions (403 Forbidden).');

  // Therapist blocked from financial reports
  const therapistReport = await fetch(`${BASE_URL}/api/reports/collections/daily?date=2026-09-22`, {
    headers: { Authorization: `Bearer ${tokens['THERAPIST']}` },
  });
  if (therapistReport.status !== 403) {
    throw new Error(`Expected Therapist financial report access to be 403 Forbidden, got ${therapistReport.status}`);
  }
  console.log('✅ Therapist correctly blocked from viewing financial reports (403 Forbidden).');

  await teardownTestEnvironment();

  console.log('====================================================');
  console.log('🎉 ALL PHASE 13 CLIENT DEMO & DEPLOYMENT READINESS TESTS PASSED!');
  console.log('====================================================');
}

runDemoReadinessTests().catch((err) => {
  console.error('❌ Phase 13 Test Error:', err);
  teardownTestEnvironment().then(() => process.exit(1));
});
