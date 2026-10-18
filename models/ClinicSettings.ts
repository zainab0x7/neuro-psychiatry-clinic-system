import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClinicSettings extends Document {
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
  clinicStartTime: string; // 18:00 (clinicStart)
  clinicEndTime: string;   // 20:00 (clinicEnd)
  appointmentDuration: number; // 45 (slotDurationMinutes)
  breakStartTime: string;
  breakEndTime: string;
  notifyEmail: boolean;
  notifySMS: boolean;
  autoRemind24h: boolean;
  operatingHours?: string;
  consultationFee?: number;
  sessionDurationMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicSettingsSchema: Schema = new Schema<IClinicSettings>(
  {
    clinicName: { type: String, required: true, default: 'Neuro Psychiatry Clinic' },
    department: { type: String, required: true, default: 'Psychiatry' },
    doctorDesignation: { type: String, required: true, default: 'HOD & Consultant Psychiatrist' },
    education: { type: String, required: true, default: 'MBBS, MCPS, FCPS, CHPE' },
    practiceName: { type: String, required: true, default: 'Neuro Psychiatry Clinic' },
    tagline: { type: String, default: 'Psychiatry Department • HOD & Consultant Psychiatrist' },
    doctorName: { type: String, required: true, default: 'DR SHAHAB MUHAMMAD' },
    licenseNumber: { type: String, required: true, default: 'NY-MED-849201' },
    phone: { type: String, default: '+1 (555) 800-VANCE' },
    email: { type: String, default: 'appointments@vancepsychiatry.com' },
    address: { type: String, default: '680 Fifth Avenue, Suite 1800, New York, NY 10019' },
    workingDays: { 
      type: [String], 
      default: ['Monday', 'Wednesday', 'Friday'] 
    },
    clinicStartTime: { type: String, default: '18:00' },
    clinicEndTime: { type: String, default: '20:00' },
    appointmentDuration: { type: Number, default: 45 },
    breakStartTime: { type: String, default: '' },
    breakEndTime: { type: String, default: '' },
    notifyEmail: { type: Boolean, default: true },
    notifySMS: { type: Boolean, default: true },
    autoRemind24h: { type: Boolean, default: true },
    operatingHours: { type: String, default: 'Mon - Sat: 09:00 AM - 08:00 PM' },
    consultationFee: { type: Number, default: 250 },
    sessionDurationMinutes: { type: Number, default: 45 },
  },
  { timestamps: true }
);

const ClinicSettings: Model<IClinicSettings> = mongoose.models.ClinicSettings || mongoose.model<IClinicSettings>('ClinicSettings', ClinicSettingsSchema);

export default ClinicSettings;
