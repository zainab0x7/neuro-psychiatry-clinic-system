import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const EmergencyContactSchema = z.object({
  name: z.string().default(''),
  relationship: z.string().default(''),
  phone: z.string().default(''),
});

export const ClinicalIntakeSchema = z.object({
  presentingComplaint: z.string().default(''),
  psychiatricHistory: z.string().default(''),
  currentMedications: z.string().default(''),
  allergies: z.string().default(''),
  familyHistory: z.string().default(''),
  riskAssessment: z.enum(['Low', 'Moderate', 'High']).optional().default('Low'),
});

export const PatientSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  age: z.number().min(0, 'Age must be non-negative'),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional().default(''),
  emergencyContact: EmergencyContactSchema.optional().default({ name: '', relationship: '', phone: '' }),
  clinicalIntake: ClinicalIntakeSchema.optional().default({
    presentingComplaint: '',
    psychiatricHistory: '',
    currentMedications: '',
    allergies: '',
    familyHistory: '',
    riskAssessment: 'Low',
  }),
  status: z.enum(['Active', 'In Treatment', 'Discharged', 'Pending Intake']).default('Active'),
  registeredDate: z.string().optional(),
  lastVisitDate: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
});

export const AppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  patientName: z.string().optional(),
  patientPhone: z.string().optional(),
  doctorId: z.string().optional().default('USR-001'),
  doctorName: z.string().optional().default('DR SHAHAB MUHAMMAD'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  appointmentTime: z.string().min(1, 'Appointment time is required'),
  durationMinutes: z.number().default(45),
  appointmentType: z.string().min(1, 'Appointment type is required'),
  notes: z.string().optional().default(''),
  room: z.string().optional().default('Consultation Suite 1'),
  status: z.enum(['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).default('Scheduled'),
});

export const MedicationItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  instructions: z.string().optional().default(''),
  refills: z.number().optional().default(0),
});

export const MentalStatusExamSchema = z.object({
  appearance: z.string().optional().default(''),
  behavior: z.string().optional().default(''),
  speech: z.string().optional().default(''),
  moodAndAffect: z.string().optional().default(''),
  thoughtProcess: z.string().optional().default(''),
  thoughtContent: z.string().optional().default(''),
  perception: z.string().optional().default(''),
  cognition: z.string().optional().default(''),
  insightAndJudgment: z.string().optional().default(''),
});

export const ConsultationSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  patientName: z.string().optional(),
  doctorId: z.string().optional().default('USR-001'),
  doctorName: z.string().optional().default('DR SHAHAB MUHAMMAD'),
  date: z.string().optional(),
  consultationDate: z.string().optional(),
  time: z.string().optional().default('10:00 AM'),
  presentingComplaint: z.string().min(1, 'Presenting complaint is required'),
  clinicalObservations: z.string().min(1, 'Clinical observations are required'),
  mentalStatusExam: MentalStatusExamSchema.optional(),
  assessment: z.string().min(1, 'Assessment is required'),
  diagnosis: z.object({
    primaryICD: z.string().min(1, 'Primary ICD code is required'),
    primaryTitle: z.string().min(1, 'Primary diagnosis title is required'),
    secondaryICD: z.string().optional().default(''),
    secondaryTitle: z.string().optional().default(''),
  }),
  treatmentPlan: z.string().min(1, 'Treatment plan is required'),
  medications: z.array(MedicationItemSchema).optional().default([]),
  followUpDate: z.string().optional().default(''),
  followUpNotes: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const PrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  patientName: z.string().optional(),
  patientAge: z.number().optional().default(30),
  patientGender: z.string().optional().default('Other'),
  doctorId: z.string().optional().default('USR-001'),
  doctorName: z.string().optional().default('DR SHAHAB MUHAMMAD'),
  doctorLicense: z.string().optional().default('NY-MED-849201'),
  prescriptionDate: z.string().optional(),
  dateIssued: z.string().optional(),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  medications: z.array(MedicationItemSchema).min(1, 'At least one medication is required'),
  treatmentPlan: z.string().optional().default(''),
  treatmentNotes: z.string().optional().default(''),
  instructions: z.string().optional().default(''),
  status: z.enum(['Active', 'Completed', 'Discontinued']).default('Active'),
});

export const FollowUpSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  patientName: z.string().optional(),
  phone: z.string().optional().default(''),
  doctorId: z.string().optional().default('USR-001'),
  assignedDoctor: z.string().optional().default('DR SHAHAB MUHAMMAD'),
  consultationId: z.string().optional().default(''),
  lastConsultationDate: z.string().optional().default('N/A'),
  dueDate: z.string().optional(),
  followUpDate: z.string().optional(),
  reason: z.string().min(1, 'Reason for follow-up is required'),
  priority: z.enum(['Routine', 'High', 'Urgent']).default('Routine'),
  status: z.enum(['Due', 'Upcoming', 'Completed', 'Overdue', 'DUE', 'UPCOMING', 'COMPLETED', 'OVERDUE']).default('Upcoming'),
  notes: z.string().optional().default(''),
});

export const UserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['DOCTOR', 'RECEPTIONIST', 'ADMIN']),
  phone: z.string().optional().default(''),
  avatar: z.string().optional().default(''),
  title: z.string().optional().default(''),
  department: z.string().optional().default(''),
});

export const ClinicSettingsSchema = z.object({
  clinicName: z.string().optional().default('Neuro Psychiatry Clinic'),
  department: z.string().optional().default('Psychiatry'),
  doctorDesignation: z.string().optional().default('HOD & Consultant Psychiatrist'),
  education: z.string().optional().default('MBBS, MCPS, FCPS, CHPE'),
  practiceName: z.string().optional().default('Neuro Psychiatry Clinic'),
  tagline: z.string().optional().default('Psychiatry Department • HOD & Consultant Psychiatrist'),
  doctorName: z.string().min(1, 'Doctor name is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  phone: z.string().optional().default(''),
  email: z.string().email('Invalid email').optional().default(''),
  address: z.string().optional().default(''),
  workingDays: z.array(z.string()).default(['Monday', 'Wednesday', 'Friday']),
  clinicStartTime: z.string().optional().default('18:00'),
  clinicStart: z.string().optional().default('18:00'),
  clinicEndTime: z.string().optional().default('20:00'),
  clinicEnd: z.string().optional().default('20:00'),
  appointmentDuration: z.number().optional().default(45),
  slotDurationMinutes: z.number().optional().default(45),
  breakStartTime: z.string().optional().default(''),
  breakStart: z.string().optional().default(''),
  breakEndTime: z.string().optional().default(''),
  breakEnd: z.string().optional().default(''),
  notifyEmail: z.boolean().optional().default(true),
  notifySMS: z.boolean().optional().default(true),
  autoRemind24h: z.boolean().optional().default(true),
});
