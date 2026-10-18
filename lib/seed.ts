import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Patient from '@/models/Patient';
import Appointment from '@/models/Appointment';
import Consultation from '@/models/Consultation';
import Prescription from '@/models/Prescription';
import FollowUp from '@/models/FollowUp';
import TherapySession from '@/models/TherapySession';
import Payment from '@/models/Payment';
import FeeCategory from '@/models/FeeCategory';
import AuditLog from '@/models/AuditLog';
import BackupLog from '@/models/BackupLog';
import ClinicSettings from '@/models/ClinicSettings';
import { hashPassword } from '@/lib/auth';
import { 
  INITIAL_USERS, 
  INITIAL_PATIENTS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_CONSULTATIONS, 
  INITIAL_PRESCRIPTIONS, 
  INITIAL_FOLLOWUPS, 
  INITIAL_THERAPY_SESSIONS,
  INITIAL_PAYMENTS,
  INITIAL_FEE_CATEGORIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_BACKUP_LOGS,
  INITIAL_CLINIC_SETTINGS 
} from '@/lib/mockData';

export async function runSeed() {
  await dbConnect();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    Consultation.deleteMany({}),
    Prescription.deleteMany({}),
    FollowUp.deleteMany({}),
    TherapySession.deleteMany({}),
    Payment.deleteMany({}),
    FeeCategory.deleteMany({}),
    AuditLog.deleteMany({}),
    BackupLog.deleteMany({}),
    ClinicSettings.deleteMany({}),
  ]);

  // 1. Seed Users with bcrypt hashed passwords
  const defaultPassword = 'Vance2026!';
  const hashedPassword = await hashPassword(defaultPassword);

  const usersToInsert = INITIAL_USERS.map((user) => ({
    userId: user.id,
    name: user.name,
    email: user.email.toLowerCase(),
    passwordHash: hashedPassword,
    role: user.role,
    phone: user.role === 'DOCTOR' ? '+1 (555) 800-8262' : user.role === 'RECEPTIONIST' ? '+1 (555) 800-8263' : user.role === 'THERAPIST' ? '+1 (555) 800-8265' : '+1 (555) 800-8264',
    avatar: user.avatar,
    title: user.title,
    department: user.department,
    permissions: user.permissions,
    isActive: true,
    lastActive: user.lastActive,
  }));

  await User.insertMany(usersToInsert);

  // 2. Seed realistic patients
  const extraPatients = [
    {
      id: 'PX-9409',
      fullName: 'Gwen Stacy-Parker',
      dateOfBirth: '1997-05-14',
      age: 29,
      gender: 'Female' as const,
      phone: '+1 (555) 432-1098',
      email: 'gwen.stacy@biolab.org',
      address: '72 Greenwich St, Apt 4A, New York, NY',
      status: 'Active' as const,
      registeredDate: '2025-08-10',
      lastVisitDate: '2026-08-22',
      nextFollowUpDate: '2026-09-18',
      emergencyContact: {
        name: 'George Stacy',
        relationship: 'Father',
        phone: '+1 (555) 901-4321',
      },
      clinicalIntake: {
        presentingComplaint: 'Post-traumatic Stress Disorder (PTSD) secondary to acute assault.',
        psychiatricHistory: 'Prior trauma 18 months ago. Experiencing intrusive nightmares, hypervigilance, and autonomic arousal.',
        currentMedications: 'Prazosin 2mg QHS for nightmares, Sertraline 100mg QAM.',
        allergies: 'None reported',
        familyHistory: 'Father with non-combat PTSD.',
        riskAssessment: 'Low' as const,
      },
    },
    {
      id: 'PX-9410',
      fullName: 'Benjamin Carmody',
      dateOfBirth: '1980-10-25',
      age: 45,
      gender: 'Male' as const,
      phone: '+1 (555) 654-9870',
      email: 'ben.carmody@architects.com',
      address: '142 Hudson St, Loft 3B, New York, NY',
      status: 'In Treatment' as const,
      registeredDate: '2024-11-20',
      lastVisitDate: '2026-09-01',
      nextFollowUpDate: '2026-09-15',
      emergencyContact: {
        name: 'Rachel Carmody',
        relationship: 'Spouse',
        phone: '+1 (555) 321-9870',
      },
      clinicalIntake: {
        presentingComplaint: 'Bipolar I Disorder with psychotic features in partial recovery.',
        psychiatricHistory: 'Inpatient hospitalization 2 years ago for manic episode. Stabilized on mood stabilizer & atypical antipsychotic.',
        currentMedications: 'Lithium Carbonate 450mg BID, Quetiapine 100mg QHS.',
        allergies: 'Haloperidol (dystonia)',
        familyHistory: 'Paternal grandmother with Bipolar I.',
        riskAssessment: 'Low' as const,
      },
    },
  ];

  const allPatientsToInsert = [...INITIAL_PATIENTS, ...extraPatients].map((patient) => ({
    patientId: patient.id,
    fullName: patient.fullName,
    dateOfBirth: patient.dateOfBirth,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email,
    address: patient.address,
    emergencyContact: patient.emergencyContact,
    clinicalIntake: patient.clinicalIntake,
    status: patient.status,
    registeredDate: patient.registeredDate,
    lastVisitDate: patient.lastVisitDate,
    nextFollowUpDate: patient.nextFollowUpDate,
  }));

  await Patient.insertMany(allPatientsToInsert);

  // 3. Seed Appointments
  const appointmentsToInsert = INITIAL_APPOINTMENTS.map((appt) => ({
    appointmentId: appt.id,
    patientId: appt.patientId,
    patientName: appt.patientName,
    patientPhone: appt.patientPhone,
    doctorId: 'USR-001',
    doctorName: appt.doctorName,
    appointmentDate: appt.date,
    appointmentTime: appt.time,
    durationMinutes: appt.durationMinutes,
    appointmentType: appt.type,
    notes: appt.notes,
    room: appt.room || 'Consultation Suite 1',
    status: appt.status,
  }));

  await Appointment.insertMany(appointmentsToInsert);

  // 4. Seed Consultations
  const consultationsToInsert = INITIAL_CONSULTATIONS.map((c) => ({
    consultationId: c.id,
    patientId: c.patientId,
    patientName: c.patientName,
    doctorId: 'USR-001',
    doctorName: c.doctorName,
    consultationDate: c.date,
    time: c.time,
    presentingComplaint: c.presentingComplaint,
    clinicalObservations: c.clinicalObservations,
    mentalStatusExam: c.mentalStatusExam,
    assessment: c.assessment,
    diagnosis: c.diagnosis,
    treatmentPlan: c.treatmentPlan,
    medications: c.medications,
    followUpDate: c.followUpDate,
    notes: c.followUpNotes || '',
    followUpNotes: c.followUpNotes || '',
  }));

  await Consultation.insertMany(consultationsToInsert);

  // 5. Seed Prescriptions
  const prescriptionsToInsert = INITIAL_PRESCRIPTIONS.map((p) => ({
    prescriptionId: p.id,
    patientId: p.patientId,
    patientName: p.patientName,
    patientAge: p.patientAge,
    patientGender: p.patientGender,
    doctorId: 'USR-001',
    doctorName: p.doctorName,
    doctorLicense: p.doctorLicense,
    prescriptionDate: p.dateIssued,
    diagnosis: p.diagnosis,
    medications: p.medications,
    treatmentPlan: p.treatmentNotes,
    instructions: p.treatmentNotes,
    status: p.status,
  }));

  await Prescription.insertMany(prescriptionsToInsert);

  // 6. Seed Follow-ups
  const followUpsToInsert = INITIAL_FOLLOWUPS.map((f) => ({
    followUpId: f.id,
    patientId: f.patientId,
    patientName: f.patientName,
    phone: f.phone,
    doctorId: 'USR-001',
    assignedDoctor: f.assignedDoctor,
    lastConsultationDate: f.lastConsultationDate,
    followUpDate: f.dueDate,
    reason: f.reason,
    priority: f.priority,
    status: f.status,
    notes: f.notes || '',
  }));

  await FollowUp.insertMany(followUpsToInsert);

  // 7. Seed Therapy Sessions
  const therapySessionsToInsert = INITIAL_THERAPY_SESSIONS.map((ts) => ({
    sessionId: ts.id,
    patientId: ts.patientId,
    patientName: ts.patientName,
    therapistId: ts.therapistId,
    therapistName: ts.therapistName,
    sessionDate: ts.sessionDate,
    durationMinutes: ts.durationMinutes,
    sessionType: ts.sessionType,
    assessment: ts.assessment,
    counselling: ts.counselling,
    intervention: ts.intervention,
    progressNotes: ts.progressNotes,
    psychometrics: ts.psychometrics,
    lifestyleInterventions: ts.lifestyleInterventions,
    followUpPlan: ts.followUpPlan,
    responsibleClinician: ts.responsibleClinician,
    status: ts.status,
  }));
  await TherapySession.insertMany(therapySessionsToInsert);

  // 8. Seed Fee Categories
  const feeCategoriesToInsert = INITIAL_FEE_CATEGORIES.map((fc) => ({
    categoryId: fc.id,
    name: fc.name,
    defaultFee: fc.defaultFee,
    description: fc.description,
    isActive: fc.isActive,
  }));
  await FeeCategory.insertMany(feeCategoriesToInsert);

  // 9. Seed Payments
  const paymentsToInsert = INITIAL_PAYMENTS.map((py) => ({
    paymentId: py.id,
    receiptNumber: py.receiptNumber,
    patientId: py.patientId,
    patientName: py.patientName,
    service: py.service,
    feeCategory: py.feeCategory,
    amount: py.amount,
    paymentMethod: py.paymentMethod,
    paymentStatus: py.paymentStatus,
    date: py.date,
    notes: py.notes || '',
  }));
  await Payment.insertMany(paymentsToInsert);

  // 10. Seed Audit Logs
  const auditLogsToInsert = INITIAL_AUDIT_LOGS.map((log) => ({
    logId: log.id,
    timestamp: log.timestamp,
    userId: log.userId,
    userName: log.userName,
    userRole: log.userRole,
    action: log.action,
    module: log.module,
    patientRef: log.patientRef || '',
    description: log.description,
  }));
  await AuditLog.insertMany(auditLogsToInsert);

  // 11. Seed Backup Logs
  const backupLogsToInsert = INITIAL_BACKUP_LOGS.map((bkp) => ({
    backupId: bkp.id,
    timestamp: bkp.timestamp,
    fileName: bkp.fileName,
    fileSize: bkp.fileSize,
    type: bkp.type,
    status: bkp.status,
    createdByName: bkp.createdByName,
  }));
  await BackupLog.insertMany(backupLogsToInsert);

  // 12. Seed Clinic Settings
  const settingsToInsert = new ClinicSettings({
    clinicName: INITIAL_CLINIC_SETTINGS.clinicName,
    department: INITIAL_CLINIC_SETTINGS.department,
    doctorDesignation: INITIAL_CLINIC_SETTINGS.doctorDesignation,
    education: INITIAL_CLINIC_SETTINGS.education,
    practiceName: INITIAL_CLINIC_SETTINGS.practiceName,
    tagline: INITIAL_CLINIC_SETTINGS.tagline,
    doctorName: INITIAL_CLINIC_SETTINGS.doctorName,
    licenseNumber: INITIAL_CLINIC_SETTINGS.licenseNumber,
    phone: INITIAL_CLINIC_SETTINGS.phone,
    email: INITIAL_CLINIC_SETTINGS.email,
    address: INITIAL_CLINIC_SETTINGS.address,
    workingDays: INITIAL_CLINIC_SETTINGS.workingDays,
    clinicStartTime: INITIAL_CLINIC_SETTINGS.clinicStart,
    clinicEndTime: INITIAL_CLINIC_SETTINGS.clinicEnd,
    appointmentDuration: INITIAL_CLINIC_SETTINGS.slotDurationMinutes,
    breakStartTime: INITIAL_CLINIC_SETTINGS.breakStart,
    breakEndTime: INITIAL_CLINIC_SETTINGS.breakEnd,
    notifyEmail: INITIAL_CLINIC_SETTINGS.notifyEmail,
    notifySMS: INITIAL_CLINIC_SETTINGS.notifySMS,
    autoRemind24h: INITIAL_CLINIC_SETTINGS.autoRemind24h,
  });

  await settingsToInsert.save();

  return {
    users: usersToInsert.length,
    patients: allPatientsToInsert.length,
    appointments: appointmentsToInsert.length,
    consultations: consultationsToInsert.length,
    prescriptions: prescriptionsToInsert.length,
    followUps: followUpsToInsert.length,
    therapySessions: therapySessionsToInsert.length,
    payments: paymentsToInsert.length,
  };
}

