import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cors from 'cors';

import User from '../models/User';
import Patient from '../models/Patient';
import FeeCategory from '../models/FeeCategory';
import Payment from '../models/Payment';

import authRoutes from '../backend/routes/authRoutes';
import patientRoutes from '../backend/routes/patientRoutes';
import { feeCategoryRouter, paymentRouter, reportRouter } from '../backend/routes/billingRoutes';
import { hashPassword, generateToken } from '../backend/utils/authUtils';

async function runPhase10Tests() {
  console.log('====================================================');
  console.log('STARTING PHASE 10: BILLING, PAYMENTS & COLLECTION REPORTS TEST SUITE');
  console.log('====================================================');

  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoMemoryServer:', mongoUri);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/fee-categories', feeCategoryRouter);
  app.use('/api/payments', paymentRouter);
  app.use('/api/reports', reportRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5010, resolve));
  const baseUrl = 'http://localhost:5010';
  console.log(`✅ Express Test Server running on ${baseUrl}`);

  try {
    // ----------------------------------------------------
    // SETUP: Seed test users & patient
    // ----------------------------------------------------
    const adminPasswordHash = await hashPassword('Admin2026!');
    const adminUser = await User.create({
      userId: 'USR-ADMIN-10',
      name: 'Marcus Sterling',
      email: 'm.sterling@vancepsychiatry.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    });

    const receptionPasswordHash = await hashPassword('Reception2026!');
    const receptionUser = await User.create({
      userId: 'USR-RECEPTION-10',
      name: 'Sarah Jenkins',
      email: 's.jenkins@vancepsychiatry.com',
      passwordHash: receptionPasswordHash,
      role: 'RECEPTION',
      isActive: true,
    });

    const doctorPasswordHash = await hashPassword('Vance2026!');
    const doctorUser = await User.create({
      userId: 'USR-DOCTOR-10',
      name: 'Dr. Shahab Vance',
      email: 'dr.vance@vancepsychiatry.com',
      passwordHash: doctorPasswordHash,
      role: 'DOCTOR',
      isActive: true,
    });

    const therapistPasswordHash = await hashPassword('Therapist2026!');
    const therapistUser = await User.create({
      userId: 'USR-THERAPIST-10',
      name: 'Dr. Emily Watson',
      email: 'e.watson@vancepsychiatry.com',
      passwordHash: therapistPasswordHash,
      role: 'THERAPIST',
      isActive: true,
    });

    console.log('✅ Seeded Admin, Reception, Doctor, and Therapist accounts.');

    // SCENARIO 1-4: Auth & Login Tokens
    const adminToken = await generateToken({ id: adminUser._id.toString(), userId: adminUser.userId, role: adminUser.role, name: adminUser.name, email: adminUser.email });
    const receptionToken = await generateToken({ id: receptionUser._id.toString(), userId: receptionUser.userId, role: receptionUser.role, name: receptionUser.name, email: receptionUser.email });
    const doctorToken = await generateToken({ id: doctorUser._id.toString(), userId: doctorUser.userId, role: doctorUser.role, name: doctorUser.name, email: doctorUser.email });
    const therapistToken = await generateToken({ id: therapistUser._id.toString(), userId: therapistUser.userId, role: therapistUser.role, name: therapistUser.name, email: therapistUser.email });

    console.log('✅ Test Scenarios 1-4 Passed: Auth Tokens generated for all 4 roles.');

    // SCENARIO 5: Create a Patient
    const patientRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        patientId: 'PX-10001',
        fullName: 'Eleanor Vance',
        dateOfBirth: '1988-04-12',
        age: 38,
        gender: 'Female',
        phone: '+1 (555) 910-1010',
        email: 'eleanor.vance@example.com',
        primaryDiagnosis: 'Bipolar Affective Disorder (F31.3)',
      }),
    });
    const patientJson = await patientRes.json();
    if (!patientJson.success) throw new Error(`Patient setup failed: ${JSON.stringify(patientJson)}`);
    const testPatientId = patientJson.data.patientId;
    console.log(`✅ Test Scenario 5 Passed: Patient Eleanor Vance created for billing with ID: ${testPatientId}.`);

    // SCENARIO 6: Admin creating a new Fee Category
    const createFeeRes = await fetch(`${baseUrl}/api/fee-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Initial Neuropsychiatric Evaluation',
        defaultFee: 350,
        description: 'Comprehensive 90-minute intake & psychiatric evaluation.',
        isActive: true,
      }),
    });
    const createFeeJson = await createFeeRes.json();
    if (!createFeeJson.success || createFeeJson.data.defaultFee !== 350) {
      throw new Error(`Create FeeCategory failed: ${JSON.stringify(createFeeJson)}`);
    }
    const feeCat1Id = createFeeJson.data.id || createFeeJson.data.categoryId;
    console.log(`✅ Test Scenario 6 Passed: Admin created FeeCategory '${createFeeJson.data.name}' ($350).`);

    // SCENARIO 7: Non-admin (Receptionist) blocked from creating a FeeCategory (403 Forbidden)
    const nonAdminFeeRes = await fetch(`${baseUrl}/api/fee-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized Fee Category',
        defaultFee: 100,
      }),
    });
    if (nonAdminFeeRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-admin fee creation, got ${nonAdminFeeRes.status}`);
    }
    console.log('✅ Test Scenario 7 Passed: Receptionist correctly blocked from creating FeeCategory (403).');

    // SCENARIO 8: Admin updating an existing Fee Category
    const updateFeeRes = await fetch(`${baseUrl}/api/fee-categories/${feeCat1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        defaultFee: 375,
        description: 'Updated fee schedule for 2026.',
      }),
    });
    const updateFeeJson = await updateFeeRes.json();
    if (!updateFeeJson.success || updateFeeJson.data.defaultFee !== 375) {
      throw new Error(`Update FeeCategory failed: ${JSON.stringify(updateFeeJson)}`);
    }
    console.log('✅ Test Scenario 8 Passed: Admin updated FeeCategory fee to $375.');

    // SCENARIO 9: Admin deactivating a Fee Category
    const deactivateFeeRes = await fetch(`${baseUrl}/api/fee-categories/${feeCat1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        isActive: false,
      }),
    });
    const deactivateFeeJson = await deactivateFeeRes.json();
    if (!deactivateFeeJson.success || deactivateFeeJson.data.isActive !== false) {
      throw new Error(`Deactivate FeeCategory failed: ${JSON.stringify(deactivateFeeJson)}`);
    }
    console.log('✅ Test Scenario 9 Passed: Admin deactivated FeeCategory (isActive: false).');

    // Re-activate for payment test
    await FeeCategory.updateOne({ categoryId: feeCat1Id }, { isActive: true });

    // SCENARIO 10: Validation of positive default fee amount requirement (<= 0 fails)
    const invalidFeeRes = await fetch(`${baseUrl}/api/fee-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Invalid Zero Fee',
        defaultFee: 0,
      }),
    });
    if (invalidFeeRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for zero defaultFee, got ${invalidFeeRes.status}`);
    }
    console.log('✅ Test Scenario 10 Passed: Backend rejected non-positive fee amount (400 Bad Request).');

    // SCENARIO 11 & 12: Reception processing payment & Auto-generating unique receipt number
    const todayStr = new Date().toISOString().split('T')[0];
    const payRes1 = await fetch(`${baseUrl}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        patientId: testPatientId,
        service: 'Initial Neuropsychiatric Evaluation',
        feeCategory: 'Consultation',
        amount: 375,
        paymentMethod: 'Bank',
        paymentStatus: 'Paid',
        date: todayStr,
        notes: 'Paid via credit card terminal #401',
      }),
    });
    const payJson1 = await payRes1.json();
    if (!payJson1.success || !payJson1.data.receiptNumber.startsWith('RCP-')) {
      throw new Error(`Payment processing failed: ${JSON.stringify(payJson1)}`);
    }
    const payment1Id = payJson1.data.id || payJson1.data.paymentId;
    const receiptNum1 = payJson1.data.receiptNumber;
    console.log(`✅ Test Scenarios 11 & 12 Passed: Reception recorded payment $375. Auto-generated receipt number: ${receiptNum1}`);

    // SCENARIO 13: Rejecting payment with zero or negative amount
    const invalidPayRes = await fetch(`${baseUrl}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        patientId: testPatientId,
        amount: -50,
        service: 'Invalid Negative Payment',
      }),
    });
    if (invalidPayRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for negative amount, got ${invalidPayRes.status}`);
    }
    console.log('✅ Test Scenario 13 Passed: Backend rejected negative payment amount (400 Bad Request).');

    // SCENARIO 14: Rejecting payment for non-existent patient ID
    const badPatientPayRes = await fetch(`${baseUrl}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        patientId: 'PX-NONEXISTENT',
        amount: 150,
        service: 'Consultation',
      }),
    });
    if (badPatientPayRes.status !== 404) {
      throw new Error(`Expected 404 Not Found for missing patient, got ${badPatientPayRes.status}`);
    }
    console.log('✅ Test Scenario 14 Passed: Backend rejected payment for non-existent patient (404 Not Found).');

    // SCENARIO 15: Doctor viewing patient payment history
    const patientPaymentsRes = await fetch(`${baseUrl}/api/patients/${testPatientId}/payments`, {
      headers: {
        Authorization: `Bearer ${doctorToken}`,
      },
    });
    const patientPaymentsJson = await patientPaymentsRes.json();
    if (!patientPaymentsJson.success || patientPaymentsJson.count < 1) {
      throw new Error(`Doctor failed to view patient payment history: ${JSON.stringify(patientPaymentsJson)}`);
    }
    console.log(`✅ Test Scenario 15 Passed: Doctor successfully retrieved ${patientPaymentsJson.count} payment record(s) for patient ${testPatientId}.`);

    // SCENARIO 16: Reception updating payment status
    const updatePayRes = await fetch(`${baseUrl}/api/payments/${payment1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        paymentStatus: 'Paid',
        notes: 'Status confirmed cleared by bank.',
      }),
    });
    const updatePayJson = await updatePayRes.json();
    if (!updatePayJson.success || updatePayJson.data.paymentStatus !== 'Paid') {
      throw new Error(`Update payment status failed: ${JSON.stringify(updatePayJson)}`);
    }
    console.log('✅ Test Scenario 16 Passed: Reception updated payment status to Paid.');

    // SCENARIO 17: Verifying receipt number immutability
    const attemptReceiptAlterRes = await fetch(`${baseUrl}/api/payments/${payment1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({
        receiptNumber: 'RCP-FAKE-ALTERED-999',
        notes: 'Attempting illegal receipt alteration',
      }),
    });
    const alterJson = await attemptReceiptAlterRes.json();
    if (!alterJson.success || alterJson.data.receiptNumber !== receiptNum1) {
      throw new Error(`Receipt number was illegally altered! Received: ${alterJson.data.receiptNumber}`);
    }
    console.log(`✅ Test Scenario 17 Passed: Immutable receipt number verified (${alterJson.data.receiptNumber} preserved).`);

    // SCENARIO 18: Generating official receipt document
    const receiptDocRes = await fetch(`${baseUrl}/api/payments/${payment1Id}/receipt`, {
      headers: {
        Authorization: `Bearer ${receptionToken}`,
      },
    });
    const receiptDocJson = await receiptDocRes.json();
    if (!receiptDocJson.success || receiptDocJson.data.receiptNumber !== receiptNum1 || !receiptDocJson.data.clinic.name) {
      throw new Error(`Receipt document generation failed: ${JSON.stringify(receiptDocJson)}`);
    }
    console.log(`✅ Test Scenario 18 Passed: Generated official receipt document for ${receiptDocJson.data.receiptNumber}. Clinic: ${receiptDocJson.data.clinic.name}.`);

    // SCENARIO 19: Fetching daily collection report
    const dailyReportRes = await fetch(`${baseUrl}/api/reports/collections/daily?date=${todayStr}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const dailyReportJson = await dailyReportRes.json();
    if (!dailyReportJson.success || dailyReportJson.data.totalCollected < 375) {
      throw new Error(`Daily collection report failed: ${JSON.stringify(dailyReportJson)}`);
    }
    console.log(`✅ Test Scenario 19 Passed: Daily collection report calculated $${dailyReportJson.data.totalCollected} for date ${todayStr}.`);

    // SCENARIO 20: Fetching monthly collection report
    const yearStr = todayStr.split('-')[0];
    const monthStr = todayStr.split('-')[1];
    const monthlyReportRes = await fetch(`${baseUrl}/api/reports/collections/monthly?year=${yearStr}&month=${monthStr}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const monthlyReportJson = await monthlyReportRes.json();
    if (!monthlyReportJson.success || monthlyReportJson.data.totalCollected < 375) {
      throw new Error(`Monthly collection report failed: ${JSON.stringify(monthlyReportJson)}`);
    }
    console.log(`✅ Test Scenario 20 Passed: Monthly collection report calculated $${monthlyReportJson.data.totalCollected} for period ${yearStr}-${monthStr}.`);

    // SCENARIO 21: Therapist access restriction
    const therapistReportRes = await fetch(`${baseUrl}/api/reports/collections/daily`, {
      headers: {
        Authorization: `Bearer ${therapistToken}`,
      },
    });
    if (therapistReportRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Therapist accessing reports, got ${therapistReportRes.status}`);
    }

    const therapistPaymentsRes = await fetch(`${baseUrl}/api/payments`, {
      headers: {
        Authorization: `Bearer ${therapistToken}`,
      },
    });
    if (therapistPaymentsRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Therapist accessing payments list, got ${therapistPaymentsRes.status}`);
    }
    console.log('✅ Test Scenario 21 Passed: Therapist strictly blocked from accessing financial reports & payments (403 Forbidden).');

    // SCENARIO 22: MongoDB Database Persistence Verification
    const dbFeeCount = await FeeCategory.countDocuments();
    const dbPaymentCount = await Payment.countDocuments({ patientId: testPatientId });
    if (dbFeeCount < 1 || dbPaymentCount < 1) {
      throw new Error(`MongoDB persistence check failed: FeeCategories=${dbFeeCount}, Payments=${dbPaymentCount}`);
    }
    console.log(`✅ Test Scenario 22 Passed: MongoDB persistence confirmed (${dbFeeCount} Fee Categories, ${dbPaymentCount} Payment Records in DB).`);

    console.log('====================================================');
    console.log('🎉 ALL 22 TEST SCENARIOS PASSED SUCCESSFULLY!');
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

runPhase10Tests();
