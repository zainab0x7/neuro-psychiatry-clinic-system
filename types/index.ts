export type UserRole = 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';

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

export interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  presentingComplaint: string;
  clinicalObservations: string;
  mentalStatusExam?: Partial<MentalStatusExam>;
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
  | 'login'
  | 'dashboard'
  | 'patients'
  | 'add-patient'
  | 'patient-profile'
  | 'consultations'
  | 'new-consultation'
  | 'appointments'
  | 'book-appointment'
  | 'appointment-calendar'
  | 'prescriptions'
  | 'follow-ups'
  | 'reports'
  | 'settings'
  | 'user-management';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}
