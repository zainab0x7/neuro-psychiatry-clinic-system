import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';

// Models
import User from '../models/User';
import Patient from '../models/Patient';
import ClinicalRecord from '../models/ClinicalRecord';
import Consultation from '../models/Consultation';
import Prescription from '../models/Prescription';
import Appointment from '../models/Appointment';
import TherapySession from '../models/TherapySession';
import FeeCategory from '../models/FeeCategory';
import Payment from '../models/Payment';
import AuditLog from '../models/AuditLog';
import BackupLog from '../models/BackupLog';
import ClinicSettings from '../models/ClinicSettings';

// Routes
import authRoutes from '../backend/routes/authRoutes';
import patientRoutes from '../backend/routes/patientRoutes';
import consultationRoutes from '../backend/routes/consultationRoutes';
import prescriptionRoutes from '../backend/routes/prescriptionRoutes';
import appointmentRoutes from '../backend/routes/appointmentRoutes';
import therapyRoutes from '../backend/routes/therapyRoutes';
import { feeCategoryRouter, paymentRouter, reportRouter } from '../backend/routes/billingRoutes';
import auditRoutes from '../backend/routes/auditRoutes';
import backupRoutes from '../backend/routes/backupRoutes';
import settingsRoutes from '../backend/routes/settingsRoutes';
import userRoutes from '../backend/routes/userRoutes';
import { notFoundHandler, errorHandler } from '../backend/middleware/errorMiddleware';

async function runPhase12QATestSuite() {
  console.log('====================================================');
  console.log(' STARTING PHASE 12: COMPLETE EMR QA & INTEGRATION TEST');
  console.log('====================================================\n');

  let mongoServer: MongoMemoryServer | undefined;
  let server: any;
  const PORT = 5012;
  const API_BASE = `http://localhost:${PORT}/api`;

  let passedScenarios = 0;
  let failedScenarios = 0;
  const scenarioErrors: string[] = [];

  function assertScenario(id: number, description: string, condition: boolean, detail: string) {
    if (condition) {
      passedScenarios++;
      console.log(`✅ Scenario ${id} Passed: ${description} — ${detail}`);
    } else {
      failedScenarios++;
      const errMsg = `❌ Scenario ${id} Failed: ${description} — ${detail}`;
      console.error(errMsg);
      scenarioErrors.push(errMsg);
    }
  }

  try {
    // 1. Database & App Server Initialization
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log(`✅ Connected to MongoMemoryServer: ${mongoUri}`);

    const app = express();
    app.use(cors());
    app.use(express.json());

    // Health Endpoint
    app.get('/api/health', (_req, res) => {
      res.status(200).json({
        success: true,
        status: 'healthy',
        service: 'Psychiatry EMR System API',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      });
    });

    // Mount Routers
    app.use('/api/auth', authRoutes);
    app.use('/api/patients', patientRoutes);
    app.use('/api/consultations', consultationRoutes);
    app.use('/api/prescriptions', prescriptionRoutes);
    app.use('/api/appointments', appointmentRoutes);
    app.use('/api/therapy', therapyRoutes);
    app.use('/api/fee-categories', feeCategoryRouter);
    app.use('/api/payments', paymentRouter);
    app.use('/api/reports', reportRouter);
    app.use('/api/audit-logs', auditRoutes);
    app.use('/api/backup', backupRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/users', userRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => resolve());
    });
    console.log(`✅ Express Test Server running on http://localhost:${PORT}`);

    const defaultPassHash = await bcrypt.hash('password123', 10);

    // Seed Staff Accounts
    await User.insertMany([
      {
        userId: 'USR-ADMIN-12',
        name: 'System Admin QA',
        email: 'admin.qa@psychiatry.com',
        passwordHash: defaultPassHash,
        role: 'ADMIN',
        status: 'Active',
        isActive: true,
      },
      {
        userId: 'USR-RECEPTION-12',
        name: 'Reception QA',
        email: 'reception.qa@psychiatry.com',
        passwordHash: defaultPassHash,
        role: 'RECEPTION',
        status: 'Active',
        isActive: true,
      },
      {
        userId: 'USR-DOCTOR-12',
        name: 'Dr. Sarah Connor',
        email: 'dr.connor@psychiatry.com',
        passwordHash: defaultPassHash,
        role: 'DOCTOR',
        title: 'Senior Consultant Psychiatrist',
        status: 'Active',
        isActive: true,
      },
      {
        userId: 'USR-DOCTOR-12-B',
        name: 'Dr. Marcus Vance',
        email: 'dr.marcus@psychiatry.com',
        passwordHash: defaultPassHash,
        role: 'DOCTOR',
        title: 'Consultant Neuropsychiatrist',
        status: 'Active',
        isActive: true,
      },
      {
        userId: 'USR-THERAPIST-12',
        name: 'Dr. Emily Watson QA',
        email: 'emily.watson@psychiatry.com',
        passwordHash: defaultPassHash,
        role: 'THERAPIST',
        title: 'Clinical Psychologist',
        status: 'Active',
        isActive: true,
      },
      {
        userId: 'USR-INACTIVE-12',
        name: 'Inactive Staff Member',
        email: 'inactive@psychiatry.com',
        passwordHash: defaultPassHash,
        role: 'DOCTOR',
        status: 'Inactive',
        isActive: false,
      },
    ]);

    // Seed Clinic Settings
    await ClinicSettings.create({
      clinicName: 'Neuro Psychiatry & Behavioral Health Clinic QA',
      address: '742 Evergreen Terrace, Medical District',
      phone: '+1-555-0199',
      email: 'contact@neuropsychiatry.com',
      doctorName: 'Dr. Sarah Connor',
      licenseNumber: 'PSY-884920-QA',
      operatingHours: 'Mon - Sat: 09:00 AM - 08:00 PM',
      consultationFee: 250,
      sessionDurationMinutes: 45,
    });

    // SECTION 1: STARTUP & HEALTH
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assertScenario(
      1,
      'Startup & Health API Check',
      healthRes.status === 200 && healthData.success && healthData.database === 'connected',
      `GET /api/health returned 200 OK (database: ${healthData.database})`
    );

    // SECTION 2: AUTHENTICATION MATRIX
    // 2a. Admin Login
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.qa@psychiatry.com', password: 'password123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token || adminLoginData.data?.token || '';

    // 2b. Doctor Login
    const docLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.connor@psychiatry.com', password: 'password123' }),
    });
    const docLoginData = await docLoginRes.json();
    const docToken = docLoginData.token || docLoginData.data?.token || '';

    // 2c. Reception Login
    const recLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception.qa@psychiatry.com', password: 'password123' }),
    });
    const recLoginData = await recLoginRes.json();
    const recToken = recLoginData.token || recLoginData.data?.token || '';

    // 2d. Therapist Login
    const therLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'emily.watson@psychiatry.com', password: 'password123' }),
    });
    const therLoginData = await therLoginRes.json();
    const therToken = therLoginData.token || therLoginData.data?.token || '';

    assertScenario(
      2,
      'Authentication Tokens for All 4 Roles',
      adminToken.length > 0 && docToken.length > 0 && recToken.length > 0 && therToken.length > 0,
      'Successfully issued JWT tokens for ADMIN, DOCTOR, RECEPTION, and THERAPIST.'
    );

    // 2e. Invalid Credentials Rejection
    const badPassRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.qa@psychiatry.com', password: 'wrongpassword' }),
    });
    assertScenario(
      3,
      'Incorrect Password Rejection',
      badPassRes.status === 401,
      `Incorrect password rejected with 401 Unauthorized.`
    );

    // 2f. Inactive Account Login Rejection
    const inactiveLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'inactive@psychiatry.com', password: 'password123' }),
    });
    assertScenario(
      4,
      'Inactive Account Login Rejection',
      inactiveLoginRes.status === 401 || inactiveLoginRes.status === 403,
      `Inactive account rejected with ${inactiveLoginRes.status} status.`
    );

    // 2g. Unauthenticated API Request Block
    const unauthRes = await fetch(`${API_BASE}/patients`);
    assertScenario(
      5,
      'Unauthenticated API Request Blocked',
      unauthRes.status === 401,
      `Unauthenticated GET /api/patients blocked with 401 Unauthorized.`
    );

    // SECTION 3: PATIENT WORKFLOW
    // 3a. Register New Patient
    const createPatientRes = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        fullName: 'Arthur Pendelton',
        dateOfBirth: '1988-04-12',
        gender: 'Male',
        phone: '+1-555-0188',
        email: 'arthur.p@example.com',
        cnic: '42101-9988776-1',
        address: '12 Baker Street, Apt 4B',
        clinicalIntake: {
          presentingComplaint: 'Recurrent depressive episodes and sleep disturbances',
          psychiatricHistory: 'Major Depressive Disorder diagnosed 2022',
          currentMedications: 'Sertraline 50mg',
          allergies: 'Penicillin',
          familyHistory: 'Maternal depression',
          riskAssessment: 'Moderate',
        },
        emergencyContact: {
          name: 'Clara Pendelton',
          relationship: 'Spouse',
          phone: '+1-555-0189',
        },
      }),
    });
    const createPatientData = await createPatientRes.json();
    const patientId = createPatientData.data?.patientId || createPatientData.data?.id;

    assertScenario(
      6,
      'Create Patient Chart',
      createPatientRes.status === 201 && Boolean(patientId),
      `Patient Arthur Pendelton registered with ID: ${patientId}`
    );

    // 3b. Search Patient by ID / Name / Phone
    const searchRes = await fetch(`${API_BASE}/patients?search=Arthur`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const searchData = await searchRes.json();
    assertScenario(
      7,
      'Search Patient by Query',
      searchRes.status === 200 && searchData.data?.length > 0,
      `Found ${searchData.data?.length} matching record(s) for query 'Arthur'.`
    );

    // 3c. Update Patient Chart
    const updatePatientRes = await fetch(`${API_BASE}/patients/${patientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        phone: '+1-555-0999',
        address: '15 Baker Street, Suite 2',
      }),
    });
    const updatePatientData = await updatePatientRes.json();
    assertScenario(
      8,
      'Update Patient Chart & Persistence',
      updatePatientRes.status === 200 && updatePatientData.data?.phone === '+1-555-0999',
      `Updated contact phone to +1-555-0999 and address.`
    );

    // 3d. Duplicate Patient CNIC Rejection
    const dupPatientRes = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        fullName: 'Arthur Pendelton Duplicate',
        dateOfBirth: '1988-04-12',
        gender: 'Male',
        phone: '+1-555-0999',
        cnic: '42101-9988776-1', // Same phone / CNIC
      }),
    });
    assertScenario(
      9,
      'Duplicate Patient Rejection',
      dupPatientRes.status === 400 || dupPatientRes.status === 409,
      `Backend rejected creation of patient with existing CNIC/phone.`
    );

    // SECTION 4: CLINICAL RECORDS WORKFLOW
    // Add Clinical Record (MSE, Risk, Medications, Allergies)
    const addRecordRes = await fetch(`${API_BASE}/patients/${patientId}/clinical-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        recordType: 'MSE',
        details: {
          appearance: 'Neat, well-groomed',
          behavior: 'Cooperative, mild psychomotor slowing',
          speech: 'Normal rate, decreased volume',
          mood: 'Depressed',
          affect: 'Constricted',
          thoughtProcess: 'Linear and goal-directed',
          thoughtContent: 'No active suicidal ideation',
          perception: 'No hallucinations',
          cognition: 'Alert and oriented x3',
          insight: 'Good',
          judgment: 'Intact',
        },
        author: 'Dr. Sarah Connor',
      }),
    });
    const addRecordData = await addRecordRes.json();
    assertScenario(
      10,
      'Add Clinical Record (MSE)',
      addRecordRes.status === 201 && Boolean(addRecordData.data?.id || addRecordData.data?._id),
      `Documented MSE record for patient ${patientId}`
    );

    // Add Second Clinical Record (Allergy)
    await fetch(`${API_BASE}/patients/${patientId}/clinical-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        recordType: 'ALLERGY',
        details: {
          allergen: 'Penicillin',
          reaction: 'Anaphylaxis rash',
          severity: 'Severe',
        },
        author: 'Dr. Sarah Connor',
      }),
    });

    const getRecordsRes = await fetch(`${API_BASE}/patients/${patientId}/clinical-records`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const getRecordsData = await getRecordsRes.json();
    assertScenario(
      11,
      'Historical Clinical Records Non-Overwriting',
      getRecordsRes.status === 200 && getRecordsData.data?.length >= 2,
      `Retrieved ${getRecordsData.data?.length} distinct clinical record entries for ${patientId}`
    );

    // SECTION 5: CONSULTATION WORKFLOW
    // Create Consultation 1
    const createConsult1Res = await fetch(`${API_BASE}/patients/${patientId}/consultations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        patientId,
        patientName: 'Arthur Pendelton',
        doctorId: 'USR-DOCTOR-12',
        doctorName: 'Dr. Sarah Connor',
        date: '2026-09-22',
        time: '10:00 AM',
        visitType: 'Initial Neuropsychiatric Eval',
        presentingComplaint: 'Low mood, insomnia, anhedonia for 6 weeks',
        clinicalObservations: 'Patient appears anxious with psychomotor fatigue.',
        mentalStatusExam: {
          appearance: 'Well-groomed',
          moodAndAffect: 'Depressed, anxious',
          thoughtProcess: 'Organized',
        },
        assessment: 'Severe Major Depressive Episode without psychotic features.',
        diagnosis: {
          primaryICD: 'F33.1',
          primaryTitle: 'Major Depressive Disorder, Recurrent, Moderate',
        },
        treatmentPlan: 'Initiate SSRI pharmacotherapy and schedule psychotherapy.',
        followUpDate: '2026-10-06',
        followUpNotes: 'Review medication tolerance in 2 weeks.',
      }),
    });
    const createConsult1Data = await createConsult1Res.json();
    const consult1Id = createConsult1Data.data?.consultationId || createConsult1Data.data?.id;

    // Create Consultation 2
    const createConsult2Res = await fetch(`${API_BASE}/patients/${patientId}/consultations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        patientId,
        patientName: 'Arthur Pendelton',
        doctorId: 'USR-DOCTOR-12',
        doctorName: 'Dr. Sarah Connor',
        date: '2026-10-06',
        time: '11:00 AM',
        visitType: 'Follow-up Consultation',
        presentingComplaint: 'Sleep improving, mood slightly better',
        clinicalObservations: 'Improved eye contact, affect brighter.',
        assessment: 'Partial response to SSRI pharmacotherapy.',
        diagnosis: {
          primaryICD: 'F33.1',
          primaryTitle: 'Major Depressive Disorder, Recurrent, Moderate',
        },
        treatmentPlan: 'Continue Sertraline 50mg daily.',
        followUpDate: '2026-11-03',
      }),
    });

    const getConsultsRes = await fetch(`${API_BASE}/patients/${patientId}/consultations`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const getConsultsData = await getConsultsRes.json();
    assertScenario(
      12,
      'Multiple Sequential Consultations & Chronology',
      getConsultsRes.status === 200 && getConsultsData.data?.length >= 2,
      `Retrieved ${getConsultsData.data?.length} consultations for ${patientId}`
    );

    // Unauthorized Edit Rejection (Reception cannot update consultation)
    const editConsultRecRes = await fetch(`${API_BASE}/consultations/${consult1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        assessment: 'Unauthorized edit attempt by reception staff',
      }),
    });
    assertScenario(
      13,
      'Unauthorized Consultation Edit Blocked (Reception)',
      editConsultRecRes.status === 403,
      `Reception staff blocked from updating consultation (403 Forbidden).`
    );

    // SECTION 6: PRESCRIPTION WORKFLOW
    // Create Multi-Medication Prescription
    const createRxRes = await fetch(`${API_BASE}/patients/${patientId}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        patientId,
        patientName: 'Arthur Pendelton',
        doctorId: 'USR-DOCTOR-12',
        doctorName: 'Dr. Sarah Connor',
        doctorLicense: 'PSY-884920-QA',
        medications: [
          {
            name: 'Sertraline HCl',
            dosage: '50mg',
            frequency: 'Once daily in the morning',
            duration: '30 days',
            instructions: 'Take after breakfast with water.',
            refills: 2,
          },
          {
            name: 'Zolpidem Tartrate',
            dosage: '5mg',
            frequency: 'Once daily at bedtime PRN',
            duration: '14 days',
            instructions: 'Use only for acute insomnia. Do not combine with alcohol.',
            refills: 0,
          },
        ],
        diagnosis: 'Major Depressive Disorder (F33.1)',
        notes: 'Follow-up in 2 weeks for side-effect evaluation.',
      }),
    });
    const createRxData = await createRxRes.json();
    const rxId = createRxData.data?.prescriptionId || createRxData.data?.id;

    assertScenario(
      14,
      'Issue Multi-Medication Prescription',
      createRxRes.status === 201 && Boolean(rxId),
      `Issued prescription ${rxId} with 2 medications for patient ${patientId}`
    );

    // Reuse Prescription creating NEW Prescription ID
    const reuseRxRes = await fetch(`${API_BASE}/patients/${patientId}/prescriptions/${rxId}/reuse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
    });
    const reuseRxData = await reuseRxRes.json();
    const newRxId = reuseRxData.data?.prescriptionId || reuseRxData.data?.id;

    assertScenario(
      15,
      'Prescription Reuse Creates NEW Record',
      reuseRxRes.status === 201 && newRxId !== rxId,
      `Reusing prescription ${rxId} created distinct new prescription record ${newRxId}`
    );

    // SECTION 7: APPOINTMENT WORKFLOW & CLINICIAN CONFLICT LOGIC
    // 7a. Book Appointment 1 for Dr. Sarah Connor
    const bookAppt1Res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId,
        patientName: 'Arthur Pendelton',
        doctorId: 'USR-DOCTOR-12',
        doctorName: 'Dr. Sarah Connor',
        appointmentDate: '2026-10-15',
        appointmentTime: '06:00 PM',
        durationMinutes: 30,
        appointmentType: 'Follow-up Consultation',
        notes: 'Regular psychiatric follow-up',
      }),
    });
    const bookAppt1Data = await bookAppt1Res.json();
    const appt1Id = bookAppt1Data.data?.appointmentId || bookAppt1Data.data?.id;

    assertScenario(
      16,
      'Book Appointment 1',
      bookAppt1Res.status === 201 && Boolean(appt1Id),
      `Booked appointment ${appt1Id} for Dr. Sarah Connor on 2026-10-15 at 06:00 PM.`
    );

    // 7b. Overlapping Booking for SAME Clinician (Must be REJECTED 409)
    const conflictSameDocRes = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId,
        patientName: 'Arthur Pendelton',
        doctorId: 'USR-DOCTOR-12', // Same doctor
        doctorName: 'Dr. Sarah Connor',
        appointmentDate: '2026-10-15',
        appointmentTime: '06:00 PM', // Same time
        durationMinutes: 30,
        appointmentType: 'Follow-up Consultation',
      }),
    });
    assertScenario(
      17,
      'Clinician Double-Booking Conflict Prevention',
      conflictSameDocRes.status === 409,
      `Overlapping slot for Dr. Sarah Connor rejected with 409 Conflict.`
    );

    // 7c. Same Time Slot for DIFFERENT Clinician (Must be ALLOWED 201)
    const diffDocApptRes = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId,
        patientName: 'Arthur Pendelton',
        doctorId: 'USR-DOCTOR-12-B', // Different doctor
        doctorName: 'Dr. Marcus Vance',
        appointmentDate: '2026-10-15',
        appointmentTime: '06:00 PM', // Same time slot allowed for another doctor
        durationMinutes: 30,
        appointmentType: 'Initial Neuropsychiatric Eval',
      }),
    });
    assertScenario(
      18,
      'Concurrent Slots for Different Clinicians Allowed',
      diffDocApptRes.status === 201,
      `Concurrent 06:00 PM slot for Dr. Marcus Vance created successfully (201 Created).`
    );

    // 7d. Update Appointment Status
    const updateApptRes = await fetch(`${API_BASE}/appointments/${appt1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({ status: 'Completed' }),
    });
    const updateApptData = await updateApptRes.json();
    assertScenario(
      19,
      'Update Appointment Status',
      updateApptRes.status === 200 && updateApptData.data?.status === 'Completed',
      `Updated appointment ${appt1Id} status to 'Completed'.`
    );

    // SECTION 8: PSYCHOTHERAPY WORKFLOW
    // 8a. Create Therapy Session
    const createTherapyRes = await fetch(`${API_BASE}/therapy/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${therToken}`,
      },
      body: JSON.stringify({
        patientId,
        sessionDate: '2026-09-22',
        sessionTime: '02:00 PM',
        durationMinutes: 50,
        sessionType: 'CBT (Cognitive Behavioral Therapy)',
        therapistId: 'USR-THERAPIST-12',
        therapistName: 'Dr. Emily Watson QA',
        clinicalAssessment: 'Patient exhibits cognitive distortions regarding work performance.',
        interventionsUsed: ['Thought Record', 'Cognitive Restructuring', 'Behavioral Activation'],
        progressNotes: 'Identified all-or-nothing thinking patterns.',
        planForNextSession: 'Assign 7-column thought log homework.',
      }),
    });
    const createTherapyData = await createTherapyRes.json();
    const session1Id = createTherapyData.data?.sessionId || createTherapyData.data?.id;

    assertScenario(
      20,
      'Document Psychotherapy Session',
      createTherapyRes.status === 201 && Boolean(session1Id),
      `Logged CBT psychotherapy session ${session1Id} for patient ${patientId}`
    );

    // SECTION 9: BILLING, PAYMENTS & COLLECTION REPORTS
    // 9a. Create Fee Category (Admin)
    const createFeeRes = await fetch(`${API_BASE}/fee-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        categoryId: 'FEE-QA-01',
        name: 'Comprehensive Psychiatric Evaluation QA',
        defaultFee: 250,
        description: 'Standard 60-minute intake consult',
      }),
    });
    assertScenario(
      21,
      'Create Configurable Fee Category',
      createFeeRes.status === 201,
      `Created fee category FEE-QA-01 ($250)`
    );

    // 9b. Record Payment 1 ($250)
    const pay1Res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId,
        patientName: 'Arthur Pendelton',
        categoryId: 'FEE-QA-01',
        categoryName: 'Comprehensive Psychiatric Evaluation QA',
        amount: 250,
        paymentMethod: 'Credit Card',
        notes: 'Paid in full via terminal',
      }),
    });
    const pay1Data = await pay1Res.json();
    const receipt1 = pay1Data.data?.receiptNumber;

    // 9c. Record Payment 2 ($150)
    await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId,
        patientName: 'Arthur Pendelton',
        categoryId: 'FEE-QA-01',
        categoryName: 'Follow-up Session',
        amount: 150,
        paymentMethod: 'Cash',
        notes: 'Cash payment',
      }),
    });

    assertScenario(
      22,
      'Record Payment & Issue Immutable Receipt',
      pay1Res.status === 201 && Boolean(receipt1?.startsWith('RCP-')),
      `Recorded payment $250 with auto-generated receipt number ${receipt1}`
    );

    // 9d. Verify Daily Collection Report ($250 + $150 = $400)
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyReportRes = await fetch(`${API_BASE}/reports/collections/daily?date=${todayStr}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dailyReportData = await dailyReportRes.json();
    assertScenario(
      23,
      'Daily Collection Aggregation Accuracy',
      dailyReportRes.status === 200 && dailyReportData.data?.totalCollected === 400,
      `Calculated total daily collections = $400 for date ${todayStr}`
    );

    // 9e. Therapist Financial Block
    const therBillingRes = await fetch(`${API_BASE}/payments`, {
      headers: { Authorization: `Bearer ${therToken}` },
    });
    assertScenario(
      24,
      'Therapist Access Blocked from Financials',
      therBillingRes.status === 403,
      `Therapist blocked from billing API (403 Forbidden).`
    );

    // SECTION 10: AUDIT LOGS TEST
    const auditLogsRes = await fetch(`${API_BASE}/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditLogsData = await auditLogsRes.json();
    assertScenario(
      25,
      'Audit Trail Event Capture',
      auditLogsRes.status === 200 && auditLogsData.data?.length >= 5,
      `Captured ${auditLogsData.data?.length} server-side audit events.`
    );

    // SECTION 11: BACKUP & DATA EXPORT TEST
    const exportRes = await fetch(`${API_BASE}/backup/export`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const exportData = await exportRes.json();
    const hasPasswordLeak = JSON.stringify(exportData).includes('passwordHash') || JSON.stringify(exportData).includes('resetPasswordToken');

    assertScenario(
      26,
      'Full Clinic Data Export & Zero Credential Leaks',
      exportRes.status === 200 && exportData.success && !hasPasswordLeak,
      `Exported database JSON (${exportData.summary?.patients} patients) with zero password or token leaks.`
    );

    // SECTION 12: SETTINGS GOVERNANCE
    // 12a. Staff View Settings
    const getSettingsRes = await fetch(`${API_BASE}/settings`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    assertScenario(
      27,
      'Staff View Clinic Settings',
      getSettingsRes.status === 200,
      `Doctor retrieved clinic profile settings.`
    );

    // 12b. Non-Admin Update Settings Block
    const updateSettingsRecRes = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({ clinicName: 'Hacked Clinic Name' }),
    });
    assertScenario(
      28,
      'Non-Admin Settings Update Blocked',
      updateSettingsRecRes.status === 403,
      `Reception staff blocked from updating settings (403 Forbidden).`
    );

    // SECTION 13: USER MANAGEMENT & SELF-DEACTIVATION PROTECTION
    const selfDeactivateRes = await fetch(`${API_BASE}/users/USR-ADMIN-12`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertScenario(
      29,
      'Admin Self-Deactivation Protection',
      selfDeactivateRes.status === 400,
      `System prevented Admin from self-deactivating active account.`
    );

    // SECTION 14: ERROR HANDLING & CLEAN JSON MESSAGES
    const badIdRes = await fetch(`${API_BASE}/patients/non-existent-patient-9999999999`, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    const badIdData = await badIdRes.json();
    assertScenario(
      30,
      'Clean 404 Error Message without Raw Stack Trace',
      badIdRes.status === 404 && badIdData.success === false && !badIdData.stack,
      `Non-existent resource returned clean JSON error message.`
    );

    // SECTION 15: COMPLETE END-TO-END CLINICAL JOURNEY
    const journeyOk =
      createPatientRes.status === 201 &&
      createConsult1Res.status === 201 &&
      createRxRes.status === 201 &&
      bookAppt1Res.status === 201 &&
      createTherapyRes.status === 201 &&
      pay1Res.status === 201 &&
      dailyReportRes.status === 200 &&
      exportRes.status === 200;

    assertScenario(
      31,
      'Complete End-to-End Clinical & Financial Journey',
      journeyOk,
      `Executed full multi-role clinic workflow successfully.`
    );

    console.log('\n====================================================');
    console.log(` SUMMARY: ${passedScenarios} PASSED, ${failedScenarios} FAILED out of ${passedScenarios + failedScenarios} SCENARIOS`);
    console.log('====================================================\n');

    if (failedScenarios > 0) {
      console.error('Failed Scenarios Detail:');
      scenarioErrors.forEach((err) => console.error(err));
      process.exit(1);
    }
  } catch (err: any) {
    console.error('\n❌ QA TEST SUITE EXECUTION ERROR:', err.message || err);
    process.exit(1);
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  }
}

runPhase12QATestSuite();
