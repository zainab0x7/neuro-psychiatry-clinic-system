import mongoose, { Schema, Document, Model } from 'mongoose';

export type AppointmentStatus = 
  | 'Scheduled' 
  | 'Confirmed' 
  | 'In Progress' 
  | 'Completed' 
  | 'Cancelled' 
  | 'No Show';

export type AppointmentType = 
  | 'Initial Neuropsychiatric Eval'
  | 'Follow-up Consultation'
  | 'Medication Review'
  | 'Psychotherapy Session'
  | 'ADHD / Cognitive Assessment'
  | 'Urgent Crisis Consult';

export interface IAppointment extends Document {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM AM/PM
  durationMinutes: number;
  appointmentType: AppointmentType;
  notes: string;
  room?: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema<IAppointment>(
  {
    appointmentId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String, default: '' },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    appointmentDate: { type: String, required: true, index: true },
    appointmentTime: { type: String, required: true },
    durationMinutes: { type: Number, default: 45 },
    appointmentType: { 
      type: String, 
      required: true 
    },
    notes: { type: String, default: '' },
    room: { type: String, default: 'Consultation Suite 1' },
    status: { 
      type: String, 
      enum: ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'Scheduled',
      index: true
    },
  },
  { timestamps: true }
);

// Compound indexes required by prompt
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
AppointmentSchema.index({ patientId: 1, appointmentDate: 1 });
AppointmentSchema.index({ appointmentDate: 1, status: 1 });

const Appointment: Model<IAppointment> = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;
