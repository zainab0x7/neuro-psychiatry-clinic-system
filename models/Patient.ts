import mongoose, { Schema, Document, Model } from 'mongoose';

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';
export type PatientStatus = 'Active' | 'In Treatment' | 'Discharged' | 'Pending Intake';

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IClinicalIntake {
  presentingComplaint: string;
  psychiatricHistory: string;
  currentMedications: string;
  allergies: string;
  familyHistory: string;
  riskAssessment?: 'Low' | 'Moderate' | 'High';
}

export interface IPatient extends Document {
  patientId: string; // PX-9401
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  emergencyContact: IEmergencyContact;
  clinicalIntake: IClinicalIntake;
  status: PatientStatus;
  registeredDate: string;
  lastVisitDate: string;
  nextFollowUpDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema<IPatient>(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, index: true },
    dateOfBirth: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { 
      type: String, 
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'], 
      required: true 
    },
    phone: { type: String, required: true, index: true },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    clinicalIntake: {
      presentingComplaint: { type: String, default: '' },
      psychiatricHistory: { type: String, default: '' },
      currentMedications: { type: String, default: '' },
      allergies: { type: String, default: '' },
      familyHistory: { type: String, default: '' },
      riskAssessment: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
    },
    status: { 
      type: String, 
      enum: ['Active', 'In Treatment', 'Discharged', 'Pending Intake'], 
      default: 'Active',
      index: true 
    },
    registeredDate: { type: String, required: true },
    lastVisitDate: { type: String, default: 'N/A' },
    nextFollowUpDate: { type: String, default: 'N/A' },
  },
  { timestamps: true }
);

// Search indexes
PatientSchema.index({ fullName: 'text', phone: 'text', patientId: 'text' });

const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

export default Patient;
