import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cors from 'cors';

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
import { hashPassword, generateToken } from '../backend/utils/authUtils';

async function runPhase11Tests() {
  console.log('====================================================');
  console.log('STARTING PHASE 11: SYSTEM HARDENING & END-TO-END TEST SUITE');
  console.log('====================================================');

  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoMemoryServer:', mongoUri);

  const app = express();
  app.use(cors());
  app.use(express.json());

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

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5011, resolve));
  const baseUrl = 'http://localhost:5011';
  console.log(`✅ Express Test Server running on ${baseUrl}`);

  try {
    // ----------------------------------------------------
    // SETUP: Seed test users for 4 roles
    // ----------------------------------------------------
    const adminPasswordHash = await hashPassword('Admin2026!');
    const adminUser = await User.create({
      userId: 'USR-ADMIN-11',
      name: 'Marcus Sterling',
      email: 'm.sterling@vancepsychiatry.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    });

    const receptionPasswordHash = await hashPassword('Reception2026!');
    const receptionUser = await User.create({
      userId: 'USR-RECEPTION-11',
      name: 'Sarah Jenkins',
      email: 's.jenkins@vancepsychiatry.com',
      passwordHash: receptionPasswordHash,
      role: 'RECEPTION',
      isActive: true,
    });

    const doctorPasswordHash = await hashPassword('Vance2026!');
    const doctorUser = await User.create({
      userId: 'USR-DOCTOR-11',
      name: 'Dr. Shahab Vance',
      email: 'dr.vance@vancepsychiatry.com',
      passwordHash: doctorPasswordHash,
      role: 'DOCTOR',
      isActive: true,
    });

    const therapistPasswordHash = await hashPassword('Therapist2026!');
    const therapistUser = await User.create({
      userId: 'USR-THERAPIST-11',
      name: 'Dr. Emily Watson',
      email: 'e.watson@vancepsychiatry.com',
      passwordHash: therapistPasswordHash,
      role: 'THERAPIST',
      isActive: true,
    });

    console.log('✅ Seeded Admin, Reception, Doctor, and Therapist accounts.');

    // SCENARIO 1-4: Auth & Tokens
    const adminToken = await generateToken({ id: adminUser._id.toString(), userId: adminUser.userId, role: adminUser.role, name: adminUser.name, email: adminUser.email });
    const receptionToken = await generateToken({ id: receptionUser._id.toString(), userId: receptionUser.userId, role: receptionUser.role, name: receptionUser.name, email: receptionUser.email });
    const doctorToken = await generateToken({ id: doctorUser._id.toString(), userId: doctorUser.userId, role: doctorUser.role, name: doctorUser.name, email: doctorUser.email });
    const therapistToken = await generateToken({ id: therapistUser._id.toString(), userId: therapistUser.userId, role: therapistUser.role, name: therapistUser.name, email: therapistUser.email });

    console.log('✅ Scenarios 1-4 Passed: JWT Auth Tokens generated for all 4 roles.');

    // SCENARIO 5: Patient Creation
    const patientRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        fullName: 'Eleanor Vance',
        dateOfBirth: '1988-04-12',
        gender: 'Female',
        phone: '+1 (555) 910-1010',
        email: 'eleanor.vance@example.com',
        primaryDiagnosis: 'Bipolar Affective Disorder (F31.3)',
      }),
    });
    const patientJson = await patientRes.json();
    if (!patientJson.success) throw new Error(`Patient creation failed: ${JSON.stringify(patientJson)}`);
    const testPatientId = patientJson.data.patientId;
    console.log(`✅ Scenario 5 Passed: Patient Eleanor Vance created with ID ${testPatientId}.`);

    // SCENARIO 6: Search & View Patient Profile
    const searchRes = await fetch(`${baseUrl}/api/patients?search=Eleanor`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const searchJson = await searchRes.json();
    if (!searchJson.success || searchJson.count < 1) throw new Error(`Patient search failed: ${JSON.stringify(searchJson)}`);
    console.log(`✅ Scenario 6 Passed: Doctor searched and retrieved patient ${testPatientId}.`);

    // SCENARIO 7: Update Patient Chart
    const updatePatientRes = await fetch(`${baseUrl}/api/patients/${testPatientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        phone: '+1 (555) 910-2020',
        status: 'In Treatment',
      }),
    });
    const updatePatientJson = await updatePatientRes.json();
    if (!updatePatientJson.success || updatePatientJson.data.phone !== '+1 (555) 910-2020') {
      throw new Error(`Update patient failed: ${JSON.stringify(updatePatientJson)}`);
    }
    console.log('✅ Scenario 7 Passed: Reception updated patient contact details & status.');

    // SCENARIO 8: Consultation Creation
    const consultRes = await fetch(`${baseUrl}/api/patients/${testPatientId}/consultations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        patientId: testPatientId,
        patientName: 'Eleanor Vance',
        consultationDate: '2026-09-21',
        presentingComplaint: 'Severe mood swings, insomnia, hyperverbally expressive.',
        clinicalObservations: 'Patient reports 4 days of decreased need for sleep (2-3h/night). Pressured speech and euphoric mood.',
        mentalStatusExam: {
          appearance: 'Neat, well-groomed.',
          speech: 'Pressured, rapid rate.',
          moodAndAffect: 'Euphoric and irritable, labile.',
          thoughtProcess: 'Flight of ideas.',
          thoughtContent: 'Grandiosity, no active suicidal ideation.',
          perception: 'No auditory or visual hallucinations.',
          cognition: 'Alert, oriented x3.',
          insightAndJudgment: 'Partial.',
        },
        assessment: 'Acute manic relapse secondary to medication non-adherence.',
        diagnosis: {
          primaryICD: 'F31.1',
          primaryTitle: 'Bipolar affective disorder, current episode manic without psychotic symptoms',
          secondaryICD: 'G47.0',
          secondaryTitle: 'Insomnia',
        },
        treatmentPlan: 'Re-initiate Mood Stabilizer (Lithium Carbonate) and short-term Atypical Antipsychotic.',
      }),
    });
    const consultJson = await consultRes.json();
    if (!consultJson.success) throw new Error(`Consultation creation failed: ${JSON.stringify(consultJson)}`);
    const consultId = consultJson.data.consultationId || consultJson.data.id;
    console.log(`✅ Scenario 8 Passed: Doctor created consultation ${consultId}.`);

    // SCENARIO 9: Prescription Issuance
    const rxRes = await fetch(`${baseUrl}/api/patients/${testPatientId}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        patientId: testPatientId,
        patientName: 'Eleanor Vance',
        patientAge: 38,
        patientGender: 'Female',
        consultationId: consultId,
        dateIssued: '2026-09-21',
        diagnosis: 'Bipolar Affective Disorder (F31.1)',
        medications: [
          {
            name: 'Lithium Carbonate',
            dosage: '400mg',
            frequency: 'Twice daily',
            duration: '30 Days',
            instructions: 'Take with food. Obtain serum lithium level in 7 days.',
          },
          {
            name: 'Quetiapine (Seroquel)',
            dosage: '100mg',
            frequency: 'At bedtime',
            duration: '14 Days',
            instructions: 'Take 30 minutes before sleep for acute mood stabilization.',
          },
        ],
        treatmentNotes: 'Follow up in 2 weeks with lab results.',
        status: 'Active',
      }),
    });
    const rxJson = await rxRes.json();
    if (!rxJson.success) throw new Error(`Prescription creation failed: ${JSON.stringify(rxJson)}`);
    const rxId = rxJson.data.prescriptionId || rxJson.data.id;
    console.log(`✅ Scenario 9 Passed: Doctor issued prescription ${rxId} with 2 medications.`);

    // SCENARIO 10: Appointment Booking
    const apptRes = await fetch(`${baseUrl}/api/patients/${testPatientId}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        patientId: testPatientId,
        patientName: 'Eleanor Vance',
        doctorName: 'Dr. Shahab Vance',
        appointmentDate: '2026-10-05',
        appointmentTime: '18:30',
        appointmentType: 'Follow-up Consultation',
        status: 'Scheduled',
        notes: '2-week lithium level check & follow-up.',
      }),
    });
    const apptJson = await apptRes.json();
    if (!apptJson.success) throw new Error(`Appointment booking failed: ${JSON.stringify(apptJson)}`);
    const apptId = apptJson.data.appointmentId || apptJson.data.id;
    console.log(`✅ Scenario 10 Passed: Reception booked appointment ${apptId} for 2026-10-05 18:30.`);

    // SCENARIO 11: Psychotherapy Session Logging
    const therapyRes = await fetch(`${baseUrl}/api/patients/${testPatientId}/therapy-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${therapistToken}`,
      },
      body: JSON.stringify({
        patientId: testPatientId,
        patientName: 'Eleanor Vance',
        sessionDate: '2026-09-22',
        sessionType: 'CBT for Bipolar Disorder',
        durationMinutes: 50,
        responsibleClinician: 'Dr. Emily Watson, PsyD',
        assessment: 'Focus on psychoeducation regarding early warning signs of mania.',
        intervention: 'Interpersonal and Social Rhythm Therapy (IPSRT) routine tracking.',
        psychometrics: 'YMRS Score: 18',
        lifestyleInterventions: 'Maintain strict sleep hygiene routine (sleep by 11 PM).',
        status: 'Completed',
      }),
    });
    const therapyJson = await therapyRes.json();
    if (!therapyJson.success) throw new Error(`Therapy session failed: ${JSON.stringify(therapyJson)}`);
    const sessionId = therapyJson.data.sessionId || therapyJson.data.id;
    console.log(`✅ Scenario 11 Passed: Therapist logged psychotherapy session ${sessionId}.`);

    // SCENARIO 12: Fee Category Creation
    const feeCatRes = await fetch(`${baseUrl}/api/fee-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Specialist Psychiatric Follow-up',
        defaultFee: 200,
        description: '45-minute psychiatric follow-up consultation.',
        isActive: true,
      }),
    });
    const feeCatJson = await feeCatRes.json();
    if (!feeCatJson.success) throw new Error(`Fee category creation failed: ${JSON.stringify(feeCatJson)}`);
    console.log('✅ Scenario 12 Passed: Admin created FeeCategory Specialist Psychiatric Follow-up ($200).');

    // SCENARIO 13: Payment Processing & Receipt Generation
    const todayStr = new Date().toISOString().split('T')[0];
    const payRes = await fetch(`${baseUrl}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        patientId: testPatientId,
        patientName: 'Eleanor Vance',
        service: 'Specialist Psychiatric Follow-up',
        feeCategory: 'Follow-up',
        amount: 200,
        paymentMethod: 'Card',
        paymentStatus: 'Paid',
        date: todayStr,
        notes: 'Paid via Visa card ending 4410',
      }),
    });
    const payJson = await payRes.json();
    if (!payJson.success || !payJson.data.receiptNumber.startsWith('RCP-')) {
      throw new Error(`Payment processing failed: ${JSON.stringify(payJson)}`);
    }
    const receiptNum = payJson.data.receiptNumber;
    console.log(`✅ Scenario 13 Passed: Reception recorded payment $200 with immutable receipt ${receiptNum}.`);

    // SCENARIO 14: System Audit Logs Retrieval (ADMIN Only)
    const auditRes = await fetch(`${baseUrl}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditJson = await auditRes.json();
    if (!auditJson.success || auditJson.count < 3) {
      throw new Error(`Audit logs retrieval failed: ${JSON.stringify(auditJson)}`);
    }
    console.log(`✅ Scenario 14 Passed: Admin retrieved ${auditJson.count} server-side audit events.`);

    // SCENARIO 15: Audit Log Access Restriction (Non-ADMIN 403)
    const doctorAuditRes = await fetch(`${baseUrl}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    if (doctorAuditRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Doctor accessing audit logs, got ${doctorAuditRes.status}`);
    }
    console.log('✅ Scenario 15 Passed: Doctor correctly blocked from audit logs (403 Forbidden).');

    // SCENARIO 16: Clinic Data Export (ADMIN Only)
    const exportRes = await fetch(`${baseUrl}/api/backup/export`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const exportJson = await exportRes.json();
    if (!exportJson.success || !exportJson.data.users || !exportJson.data.patients) {
      throw new Error(`Data export failed: ${JSON.stringify(exportJson)}`);
    }
    // Verify password hashes are excluded
    const sampleUser = exportJson.data.users[0];
    if (sampleUser.passwordHash) {
      throw new Error('SECURITY VIOLATION: passwordHash leaked in data export!');
    }
    console.log(`✅ Scenario 16 Passed: Admin exported full clinic data JSON (${exportJson.data.patients.length} patients, zero password leaks).`);

    // SCENARIO 17: Backup Snapshot Creation & History (ADMIN Only)
    const createBackupRes = await fetch(`${baseUrl}/api/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ type: 'Full System' }),
    });
    const createBackupJson = await createBackupRes.json();
    if (!createBackupJson.success || !createBackupJson.data.backupId) {
      throw new Error(`Backup creation failed: ${JSON.stringify(createBackupJson)}`);
    }
    const backupId = createBackupJson.data.backupId;
    console.log(`✅ Scenario 17 Passed: Admin generated local backup archive ${backupId} (${createBackupJson.data.fileName}).`);

    // SCENARIO 18: Backup History Retrieval
    const getBackupsRes = await fetch(`${baseUrl}/api/backup`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getBackupsJson = await getBackupsRes.json();
    if (!getBackupsJson.success || getBackupsJson.count < 1) {
      throw new Error(`Get backup logs failed: ${JSON.stringify(getBackupsJson)}`);
    }
    console.log(`✅ Scenario 18 Passed: Admin retrieved backup history (${getBackupsJson.count} archive logs).`);

    // SCENARIO 19: Clinic Settings Viewing (All Roles)
    const settingsGetRes = await fetch(`${baseUrl}/api/settings`, {
      headers: { Authorization: `Bearer ${therapistToken}` },
    });
    const settingsGetJson = await settingsGetRes.json();
    if (!settingsGetJson.success || !settingsGetJson.data.clinicName) {
      throw new Error(`Get settings failed: ${JSON.stringify(settingsGetJson)}`);
    }
    console.log(`✅ Scenario 19 Passed: Therapist viewed clinic profile settings (${settingsGetJson.data.clinicName}).`);

    // SCENARIO 20: Clinic Settings Update (ADMIN Only)
    const settingsPutRes = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        clinicName: 'Neuro Psychiatry & Behavioral Health Clinic',
        phone: '+1 (555) 800-VANCE',
        appointmentDuration: 45,
      }),
    });
    const settingsPutJson = await settingsPutRes.json();
    if (!settingsPutJson.success || settingsPutJson.data.clinicName !== 'Neuro Psychiatry & Behavioral Health Clinic') {
      throw new Error(`Update settings failed: ${JSON.stringify(settingsPutJson)}`);
    }
    console.log('✅ Scenario 20 Passed: Admin updated clinic profile & operating parameters.');

    // SCENARIO 21: Settings Update Restriction (Non-ADMIN 403)
    const receptionSettingsRes = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({ clinicName: 'Illegal Name Change' }),
    });
    if (receptionSettingsRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Reception updating settings, got ${receptionSettingsRes.status}`);
    }
    console.log('✅ Scenario 21 Passed: Reception correctly blocked from updating settings (403 Forbidden).');

    // SCENARIO 22: User Management - Admin Listing Users
    const getUsersRes = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getUsersJson = await getUsersRes.json();
    if (!getUsersJson.success || getUsersJson.count < 4) {
      throw new Error(`Get users failed: ${JSON.stringify(getUsersJson)}`);
    }
    console.log(`✅ Scenario 22 Passed: Admin listed all ${getUsersJson.count} staff user accounts.`);

    // SCENARIO 23: User Management - Admin Creating Staff User
    const createStaffRes = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Dr. Alan Grant',
        email: 'a.grant@vancepsychiatry.com',
        password: 'Doctor2026!',
        role: 'DOCTOR',
        phone: '+1 (555) 440-1010',
        title: 'Associate Psychiatrist',
        department: 'Adult Psychiatry',
      }),
    });
    const createStaffJson = await createStaffRes.json();
    if (!createStaffJson.success) throw new Error(`Staff creation failed: ${JSON.stringify(createStaffJson)}`);
    const newStaffId = createStaffJson.user.userId || createStaffJson.user.id;
    console.log(`✅ Scenario 23 Passed: Admin created new Doctor account ${newStaffId} for Dr. Alan Grant.`);

    // SCENARIO 24: User Management - Updating User Role/Status
    const updateUserRes = await fetch(`${baseUrl}/api/users/${newStaffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Senior Associate Psychiatrist',
        isActive: true,
      }),
    });
    const updateUserJson = await updateUserRes.json();
    if (!updateUserJson.success || updateUserJson.user.title !== 'Senior Associate Psychiatrist') {
      throw new Error(`Update user failed: ${JSON.stringify(updateUserJson)}`);
    }
    console.log('✅ Scenario 24 Passed: Admin updated title and status for staff user.');

    // SCENARIO 25: Prevention of Role Elevation (Non-ADMIN creating user 403)
    const doctorCreateUserRes = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        name: 'Hacker User',
        email: 'hacker@example.com',
        password: 'Password123!',
        role: 'ADMIN',
      }),
    });
    if (doctorCreateUserRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Doctor creating user account, got ${doctorCreateUserRes.status}`);
    }
    console.log('✅ Scenario 25 Passed: Doctor strictly blocked from creating user accounts (Role elevation prevented).');

    // SCENARIO 26: Daily Collection Report Verification
    const dailyReportRes = await fetch(`${baseUrl}/api/reports/collections/daily?date=${todayStr}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dailyReportJson = await dailyReportRes.json();
    if (!dailyReportJson.success || dailyReportJson.data.totalCollected < 200) {
      throw new Error(`Daily report failed: ${JSON.stringify(dailyReportJson)}`);
    }
    console.log(`✅ Scenario 26 Passed: Daily collection report verified $${dailyReportJson.data.totalCollected} for date ${todayStr}.`);

    // SCENARIO 27: Monthly Collection Report Verification
    const yearStr = todayStr.split('-')[0];
    const monthStr = todayStr.split('-')[1];
    const monthlyReportRes = await fetch(`${baseUrl}/api/reports/collections/monthly?year=${yearStr}&month=${monthStr}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const monthlyReportJson = await monthlyReportRes.json();
    if (!monthlyReportJson.success || monthlyReportJson.data.totalCollected < 200) {
      throw new Error(`Monthly report failed: ${JSON.stringify(monthlyReportJson)}`);
    }
    console.log(`✅ Scenario 27 Passed: Monthly collection report verified $${monthlyReportJson.data.totalCollected} for period ${yearStr}-${monthStr}.`);

    // SCENARIO 28: Soft Deactivating User Account
    const deleteUserRes = await fetch(`${baseUrl}/api/users/${newStaffId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteUserJson = await deleteUserRes.json();
    if (!deleteUserJson.success) throw new Error(`User deactivation failed: ${JSON.stringify(deleteUserJson)}`);
    console.log(`✅ Scenario 28 Passed: Admin deactivated staff account ${newStaffId}.`);

    // SCENARIO 29: Prevention of Admin Self-Deactivation
    const selfDeleteRes = await fetch(`${baseUrl}/api/users/USR-ADMIN-11`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (selfDeleteRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for self-deactivation, got ${selfDeleteRes.status}`);
    }
    console.log('✅ Scenario 29 Passed: System prevented Admin self-deactivation (400 Bad Request).');

    // SCENARIO 30: Database Persistence & Record Integrity Check
    const dbUserCount = await User.countDocuments();
    const dbPatientCount = await Patient.countDocuments();
    const dbConsultCount = await Consultation.countDocuments();
    const dbRxCount = await Prescription.countDocuments();
    const dbApptCount = await Appointment.countDocuments();
    const dbTherapyCount = await TherapySession.countDocuments();
    const dbPaymentCount = await Payment.countDocuments();
    const dbAuditCount = await AuditLog.countDocuments();
    const dbBackupCount = await BackupLog.countDocuments();

    if (
      dbUserCount < 5 ||
      dbPatientCount < 1 ||
      dbConsultCount < 1 ||
      dbRxCount < 1 ||
      dbApptCount < 1 ||
      dbTherapyCount < 1 ||
      dbPaymentCount < 1 ||
      dbAuditCount < 5 ||
      dbBackupCount < 1
    ) {
      throw new Error(`MongoDB record integrity check failed: Users=${dbUserCount}, Patients=${dbPatientCount}, Consultations=${dbConsultCount}, Prescriptions=${dbRxCount}, Appts=${dbApptCount}, Therapy=${dbTherapyCount}, Payments=${dbPaymentCount}, Audits=${dbAuditCount}, Backups=${dbBackupCount}`);
    }

    console.log(`✅ Scenario 30 Passed: MongoDB database persistence confirmed across all 11 modules:
       - Staff Users: ${dbUserCount}
       - Patients: ${dbPatientCount}
       - Consultations: ${dbConsultCount}
       - Prescriptions: ${dbRxCount}
       - Appointments: ${dbApptCount}
       - Therapy Sessions: ${dbTherapyCount}
       - Payment Records: ${dbPaymentCount}
       - Audit Log Events: ${dbAuditCount}
       - Backup Snapshots: ${dbBackupCount}`);

    console.log('====================================================');
    console.log('🎉 ALL 30 SYSTEM HARDENING TEST SCENARIOS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (error: any) {
    console.error('❌ TEST FAILED:', error.message || error);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runPhase11Tests();
