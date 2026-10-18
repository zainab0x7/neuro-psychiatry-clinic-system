import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedicationItem {
  id?: string;
  name: string; // medicineName
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  refills?: number;
}

export interface IMentalStatusExam {
  appearance?: string;
  behavior?: string;
  speech?: string;
  moodAndAffect?: string;
  thoughtProcess?: string;
  thoughtContent?: string;
  perception?: string;
  cognition?: string;
  insightAndJudgment?: string;
}

export interface IDiagnosis {
  primaryICD: string;
  primaryTitle: string;
  secondaryICD?: string;
  secondaryTitle?: string;
}

export interface IConsultation extends Document {
  consultationId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicianId?: string;
  clinicianName?: string;
  consultationDate: string; // YYYY-MM-DD
  time: string;
  visitType?: string;
  presentingComplaint: string;
  clinicalObservations: string;
  mentalStatusExam?: IMentalStatusExam;
  assessment: string;
  diagnosis: IDiagnosis;
  treatmentPlan: string;
  medications: IMedicationItem[];
  followUpDate?: string;
  notes?: string;
  followUpNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicationItemSchema = new Schema({
  id: { type: String },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String, default: '' },
  refills: { type: Number, default: 0 },
});

const ConsultationSchema: Schema = new Schema<IConsultation>(
  {
    consultationId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    clinicianId: { type: String },
    clinicianName: { type: String },
    consultationDate: { type: String, required: true, index: true },
    time: { type: String, default: '10:00 AM' },
    visitType: { type: String, default: 'Follow-up Consultation' },
    presentingComplaint: { type: String, required: true },
    clinicalObservations: { type: String, required: true },
    mentalStatusExam: {
      appearance: { type: String, default: '' },
      behavior: { type: String, default: '' },
      speech: { type: String, default: '' },
      moodAndAffect: { type: String, default: '' },
      thoughtProcess: { type: String, default: '' },
      thoughtContent: { type: String, default: '' },
      perception: { type: String, default: '' },
      cognition: { type: String, default: '' },
      insightAndJudgment: { type: String, default: '' },
    },
    assessment: { type: String, required: true },
    diagnosis: {
      primaryICD: { type: String, required: true },
      primaryTitle: { type: String, required: true },
      secondaryICD: { type: String, default: '' },
      secondaryTitle: { type: String, default: '' },
    },
    treatmentPlan: { type: String, required: true },
    medications: [MedicationItemSchema],
    followUpDate: { type: String, default: '' },
    notes: { type: String, default: '' },
    followUpNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Pre-save hook to ensure clinicianId and clinicianName sync with doctorId and doctorName
ConsultationSchema.pre('save', function () {
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
});

// Compound indexes for patient timeline & clinician roster queries
ConsultationSchema.index({ patientId: 1, consultationDate: -1 });
ConsultationSchema.index({ doctorId: 1, consultationDate: -1 });

const Consultation: Model<IConsultation> = mongoose.models.Consultation || mongoose.model<IConsultation>('Consultation', ConsultationSchema);

export default Consultation;
