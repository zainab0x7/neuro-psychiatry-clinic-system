import mongoose, { Schema, Document, Model } from 'mongoose';

export type PrescriptionStatus = 'Active' | 'Completed' | 'Discontinued';

export interface IRxMedicationItem {
  id?: string;
  name: string;
  strength?: string;
  dosage: string; // strength / dose
  dose?: string;
  route?: string;
  frequency: string;
  duration: string;
  instructions?: string;
  refills?: number;
}

export interface IPrescription extends Document {
  prescriptionId: string; // e.g. RX-901
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  clinicianId?: string;
  clinicianName?: string;
  doctorLicense: string;
  prescriptionDate: string; // YYYY-MM-DD
  dateIssued?: string; // YYYY-MM-DD
  consultationId?: string;
  diagnosis: string;
  medications: IRxMedicationItem[];
  treatmentPlan?: string;
  treatmentNotes?: string;
  instructions?: string;
  notes?: string;
  status: PrescriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const RxMedicationItemSchema = new Schema({
  id: { type: String },
  name: { type: String, required: true },
  strength: { type: String, default: '' },
  dosage: { type: String, required: true },
  dose: { type: String, default: '' },
  route: { type: String, default: 'Oral' },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String, default: '' },
  refills: { type: Number, default: 0 },
});

const PrescriptionSchema: Schema = new Schema<IPrescription>(
  {
    prescriptionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientAge: { type: Number, default: 30 },
    patientGender: { type: String, default: 'Other' },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    clinicianId: { type: String },
    clinicianName: { type: String },
    doctorLicense: { type: String, default: '' },
    prescriptionDate: { type: String, required: true, index: true },
    dateIssued: { type: String, index: true },
    consultationId: { type: String, default: '' },
    diagnosis: { type: String, required: true },
    medications: [RxMedicationItemSchema],
    treatmentPlan: { type: String, default: '' },
    treatmentNotes: { type: String, default: '' },
    instructions: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Discontinued'],
      default: 'Active',
      index: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook for field synchronization
PrescriptionSchema.pre('save', function () {
  if (!this.clinicianId && this.doctorId) {
    this.clinicianId = this.doctorId;
  } else if (!this.doctorId && this.clinicianId) {
    this.doctorId = this.clinicianId;
  }

  if (!this.clinicianName && this.doctorName) {
    this.clinicianName = this.doctorName;
  } else if (!this.doctorName && this.clinicianName) {
    this.doctorName = this.clinicianName;
  }

  if (!this.dateIssued && this.prescriptionDate) {
    this.dateIssued = this.prescriptionDate;
  } else if (!this.prescriptionDate && this.dateIssued) {
    this.prescriptionDate = this.dateIssued;
  }

  if (!this.treatmentNotes && this.treatmentPlan) {
    this.treatmentNotes = this.treatmentPlan;
  } else if (!this.treatmentPlan && this.treatmentNotes) {
    this.treatmentPlan = this.treatmentNotes;
  }
});

// Compound indexes for prescription timeline & status filtering
PrescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });
PrescriptionSchema.index({ doctorId: 1, prescriptionDate: -1 });
PrescriptionSchema.index({ status: 1, prescriptionDate: -1 });

const Prescription: Model<IPrescription> =
  mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);

export default Prescription;
