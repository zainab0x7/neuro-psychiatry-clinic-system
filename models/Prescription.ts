import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMedicationItem } from './Consultation';

export type PrescriptionStatus = 'Active' | 'Completed' | 'Discontinued';

export interface IPrescription extends Document {
  prescriptionId: string; // RX-901
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  doctorLicense: string;
  prescriptionDate: string; // YYYY-MM-DD (dateIssued)
  diagnosis: string;
  medications: IMedicationItem[];
  treatmentPlan?: string; // treatmentNotes
  treatmentNotes?: string;
  instructions?: string;
  status: PrescriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema: Schema = new Schema<IPrescription>(
  {
    prescriptionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientAge: { type: Number, default: 30 },
    patientGender: { type: String, default: 'Other' },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    doctorLicense: { type: String, default: '' },
    prescriptionDate: { type: String, required: true, index: true },
    diagnosis: { type: String, required: true },
    medications: [
      {
        id: { type: String },
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String, default: '' },
        refills: { type: Number, default: 0 },
      },
    ],
    treatmentPlan: { type: String, default: '' },
    instructions: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ['Active', 'Completed', 'Discontinued'], 
      default: 'Active',
      index: true 
    },
  },
  { timestamps: true }
);

const Prescription: Model<IPrescription> = mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);

export default Prescription;
