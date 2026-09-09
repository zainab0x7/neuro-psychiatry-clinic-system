import mongoose, { Schema, Document, Model } from 'mongoose';

export type FollowUpPriority = 'Routine' | 'High' | 'Urgent';
export type FollowUpStatus = 'Due' | 'Upcoming' | 'Completed' | 'Overdue' | 'DUE' | 'UPCOMING' | 'COMPLETED' | 'OVERDUE';

export interface IFollowUp extends Document {
  followUpId: string; // FLP-301
  patientId: string;
  patientName: string;
  phone: string;
  doctorId?: string;
  assignedDoctor: string;
  consultationId?: string;
  lastConsultationDate: string;
  followUpDate: string; // YYYY-MM-DD (dueDate)
  reason: string;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema: Schema = new Schema<IFollowUp>(
  {
    followUpId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    phone: { type: String, default: '' },
    doctorId: { type: String, default: '' },
    assignedDoctor: { type: String, required: true },
    consultationId: { type: String, default: '' },
    lastConsultationDate: { type: String, default: 'N/A' },
    followUpDate: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    priority: { 
      type: String, 
      enum: ['Routine', 'High', 'Urgent'], 
      default: 'Routine' 
    },
    status: { 
      type: String, 
      enum: ['Due', 'Upcoming', 'Completed', 'Overdue', 'DUE', 'UPCOMING', 'COMPLETED', 'OVERDUE'], 
      default: 'Upcoming',
      index: true 
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound index required by prompt
FollowUpSchema.index({ followUpDate: 1, status: 1 });

const FollowUp: Model<IFollowUp> = mongoose.models.FollowUp || mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);

export default FollowUp;
