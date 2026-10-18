export type UserRole = 'DOCTOR' | 'ADMIN' | 'RECEPTIONIST' | 'RECEPTION' | 'THERAPIST';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
  designation?: string;
  education?: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastActive: string;
  permissions: {
    canWriteClinicalNotes: boolean;
    canPrescribe: boolean;
    canManagePatients: boolean;
    canManageAppointments: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
  };
}

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export type PatientStatus = 'Active' | 'In Treatment' | 'Discharged' | 'Pending Intake';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface ClinicalIntake {
  presentingComplaint: string;
  psychiatricHistory: string;
  currentMedications: string;
  allergies: string;
  familyHistory: string;
  riskAssessment?: 'Low' | 'Moderate' | 'High';
}

export interface Patient {
  id: string; // e.g., PX-9402
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  status: PatientStatus;
  registeredDate: string;
  lastVisitDate: string;
  nextFollowUpDate: string;
  emergencyContact: EmergencyContact;
  clinicalIntake: ClinicalIntake;
}

export interface PsychiatricHistoryDetails {
  presentingHistory: string;
  previousTreatment: string;
  previousDiagnoses: string;
  hospitalizationHistory: string;
  treatmentResponse: string;
  relevantHistory: string;
}

export interface MedicalHistoryDetails {
  chronicConditions: string;
  surgeries: string;
  neurologicalHistory: string;
  currentPhysicalIllnesses: string;
}

export interface PersonalHistoryDetails {
  birthPerinatal: string;
  developmentalMilestones: string;
  educationalHistory: string;
  occupationalHistory: string;
}

export interface FamilyHistoryDetails {
  mentalHealthDisorders: string;
  substanceMisuse: string;
  completedSuicides: string;
  familyStructure: string;
}

export interface SocialHistoryDetails {
  livingSituation: string;
  psychosocialStressors: string;
  substanceUseProfile: {
    alcohol: string;
    tobacco: string;
    illicit: string;
  };
  legalHistory: string;
}

export interface MSEDetails {
  appearance: string;
  behavior: string;
  speech: string;
  mood: string;
  affect: string;
  thoughtContent: string;
  thoughtProcess: string;
  perception: string;
  cognition: string;
  insight: string;
  judgment: string;
}

export interface RiskMatrixDetails {
  suicideRisk: 'Low' | 'Moderate' | 'High';
  homicideRisk: 'Low' | 'Moderate' | 'High';
  selfHarmRisk: 'Low' | 'Moderate' | 'High';
  vulnerabilityRisk: 'Low' | 'Moderate' | 'High';
  riskNotes: string;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  psychiatricHistory: PsychiatricHistoryDetails;
  medicalHistory: MedicalHistoryDetails;
  personalHistory: PersonalHistoryDetails;
  familyHistory: FamilyHistoryDetails;
  socialHistory: SocialHistoryDetails;
  mentalStatusExam: MSEDetails;
  riskAssessment: RiskMatrixDetails;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PsychometricAssessmentRecord {
  id: string;
  patientId: string;
  assessmentName: string;
  score: string;
  maxScore?: number;
  severity: string;
  date: string; // YYYY-MM-DD
  notes: string;
  clinicianName: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
}

export interface MedicationRecordItem {
  id: string;
  patientId: string;
  name: string;
  strength: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  status: 'Active' | 'Completed' | 'Discontinued';
  startDate: string;
  endDate?: string;
  prescribingClinician: string;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
}

export interface AllergyRecordItem {
  id: string;
  patientId: string;
  allergen: string;
  reaction: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimelineEventItem {
  id: string;
  patientId: string;
  date: string;
  title: string;
  category: 'Registration' | 'Clinical Record' | 'Assessment' | 'Medication' | 'Consultation' | 'Therapy' | 'Allergy';
  description: string;
  author: string;
  metadata?: Record<string, any>;
}


export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
export type AppointmentType = 
  | 'Initial Neuropsychiatric Eval'
  | 'Follow-up Consultation'
  | 'Medication Review'
  | 'Psychotherapy Session'
  | 'ADHD / Cognitive Assessment'
  | 'Urgent Crisis Consult';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string;
  room?: string;
  onlineSessionLink?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string; // e.g. "50mg"
  frequency: string; // e.g. "Once daily at bedtime"
  duration: string; // e.g. "30 days"
  instructions: string; // e.g. "Take with food. Monitor blood pressure."
  refills: number;
}

export interface MentalStatusExam {
  appearance: string;
  behavior: string;
  speech: string;
  moodAndAffect: string;
  thoughtProcess: string;
  thoughtContent: string;
  perception: string;
  cognition: string;
  insightAndJudgment: string;
}

export interface DetailedMSE {
  appearance: string;
  behaviour: string;
  speech: string;
  mood: string;
  affect: string;
  thoughtProcess: string;
  thoughtContent: string;
  perception: string;
  cognition: string;
  insight: string;
  judgment: string;
}

export interface RiskAssessmentDetails {
  suicidalRisk: 'None' | 'Low' | 'Moderate' | 'High';
  selfHarmRisk: 'None' | 'Low' | 'Moderate' | 'High';
  violenceRisk: 'None' | 'Low' | 'Moderate' | 'High';
  otherRisk: string;
  riskNotes: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName: string;
  date: string;
  consultationDate?: string;
  time: string;
  visitType?: string;
  presentingComplaint: string;
  clinicalObservations: string;
  mentalStatusExam?: Partial<MentalStatusExam>;
  detailedMSE?: DetailedMSE;
  riskAssessment?: RiskAssessmentDetails;
  psychometrics?: string;
  psychiatricHistory?: string;
  medicalHistory?: string;
  personalFamilySocialHistory?: string;
  assessment: string;
  diagnosis: {
    primaryICD: string; // e.g., F31.3
    primaryTitle: string; // e.g., Bipolar I Disorder, Current Episode Depressed
    secondaryICD?: string;
    secondaryTitle?: string;
  };
  treatmentPlan: string;
  medications: MedicationItem[];
  followUpDate: string;
  followUpNotes: string;
}

export interface Prescription {
  id: string; // RX-1092
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: Gender;
  doctorName: string;
  doctorLicense: string;
  dateIssued: string;
  diagnosis: string;
  medications: MedicationItem[];
  treatmentNotes: string;
  status: 'Active' | 'Completed' | 'Discontinued';
}

export type FollowUpPriority = 'Routine' | 'High' | 'Urgent';
export type FollowUpStatus = 'Due' | 'Upcoming' | 'Completed' | 'Overdue';

export interface FollowUp {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  lastConsultationDate: string;
  dueDate: string;
  reason: string;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  assignedDoctor: string;
  notes?: string;
}

export interface TherapySession {
  id: string; // e.g. TS-701
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  sessionDate: string;
  durationMinutes: number;
  sessionType: 'CBT' | 'Psychodynamic' | 'Supportive Psychotherapy' | 'Family Therapy' | 'Interpersonal (IPT)' | 'Mindfulness-Based (MBCT)' | 'Exposure & Response Prevention (ERP)';
  assessment: string;
  counselling: string;
  intervention: string;
  progressNotes: string;
  psychometrics: string;
  lifestyleInterventions: string;
  followUpPlan: string;
  responsibleClinician: string;
  status: 'Completed' | 'Scheduled' | 'Draft';
}

export interface PaymentRecord {
  id: string; // e.g. PY-401
  receiptNumber: string;
  patientId: string;
  patientName: string;
  service: string;
  feeCategory: 'Consultation' | 'Follow-up' | 'Therapy Session' | 'Other';
  amount: number;
  paymentMethod: 'Cash' | 'Bank' | 'Other';
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  date: string;
  notes?: string;
}

export interface FeeCategory {
  id: string;
  name: string;
  defaultFee: number;
  description: string;
  isActive: boolean;
}

export interface AuditLogEntry {
  id: string; // e.g. LOG-8910
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  patientRef?: string;
  description: string;
}

export interface BackupLogEntry {
  id: string;
  timestamp: string;
  fileName: string;
  fileSize: string;
  type: 'Full System' | 'Patient Records' | 'Financial & Billing' | 'Audit Logs';
  status: 'Completed' | 'In Progress' | 'Failed';
  createdByName: string;
}

export interface ClinicSettings {
  clinicName: string;
  department: string;
  doctorDesignation: string;
  education: string;
  practiceName: string;
  tagline: string;
  doctorName: string;
  licenseNumber: string;
  phone: string;
  email: string;
  address: string;
  workingDays: string[];
  clinicStart: string;
  clinicEnd: string;
  slotDurationMinutes: number;
  breakStart: string;
  breakEnd: string;
  notifyEmail: boolean;
  notifySMS: boolean;
  autoRemind24h: boolean;
}

export type ScreenId = 
  | 'landing'
  | 'login'
  | 'forgot-password'
  | 'dashboard'
  | 'patients'
  | 'add-patient'
  | 'patient-profile'
  | 'consultations'
  | 'new-consultation'
  | 'appointments'
  | 'book-appointment'
  | 'appointment-calendar'
  | 'online-consultation'
  | 'prescriptions'
  | 'follow-ups'
  | 'therapy'
  | 'billing'
  | 'reports'
  | 'backup'
  | 'user-management'
  | 'audit-log'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

