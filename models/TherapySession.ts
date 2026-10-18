import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITherapySessionDoc extends Document {
  sessionId: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  sessionDate: string;
  durationMinutes: number;
  sessionType: string;
  assessment: string;
  counselling: string;
  intervention: string;
  progressNotes: string;
  psychometrics: string;
  lifestyleInterventions: string;
  followUpPlan: string;
  followUpDate?: string;
  responsibleClinician: string;
  responsibleClinicianId?: string;
  status: 'Completed' | 'Scheduled' | 'Draft';
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TherapySessionSchema: Schema<ITherapySessionDoc> = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    therapistId: { type: String, required: true, index: true },
    therapistName: { type: String, required: true },
    sessionDate: { type: String, required: true, index: true },
    durationMinutes: { type: Number, default: 50 },
    sessionType: { type: String, required: true },
    assessment: { type: String, default: '' },
    counselling: { type: String, default: '' },
    intervention: { type: String, default: '' },
    progressNotes: { type: String, default: '' },
    psychometrics: { type: String, default: '' },
    lifestyleInterventions: { type: String, default: '' },
    followUpPlan: { type: String, default: '' },
    followUpDate: { type: String, default: '' },
    responsibleClinician: { type: String, default: '' },
    responsibleClinicianId: { type: String, default: '' },
    status: { type: String, enum: ['Completed', 'Scheduled', 'Draft'], default: 'Completed' },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound indexes for fast historical queries
TherapySessionSchema.index({ patientId: 1, sessionDate: -1 });
TherapySessionSchema.index({ therapistId: 1, sessionDate: -1 });

const TherapySession: Model<ITherapySessionDoc> =
  mongoose.models.TherapySession || mongoose.model<ITherapySessionDoc>('TherapySession', TherapySessionSchema);

export default TherapySession;

