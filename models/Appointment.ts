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
  clinicianId: string;
  clinicianName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM AM/PM
  durationMinutes: number;
  appointmentType: string;
  notes: string;
  room?: string;
  consultationMode?: string;
  onlineSessionLink?: string;
  status: string;
  createdBy?: string;
  updatedBy?: string;
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
    clinicianId: { type: String, default: '', index: true },
    clinicianName: { type: String, default: '' },
    appointmentDate: { type: String, required: true, index: true },
    appointmentTime: { type: String, required: true },
    durationMinutes: { type: Number, default: 45 },
    appointmentType: { 
      type: String, 
      required: true 
    },
    notes: { type: String, default: '' },
    room: { type: String, default: 'Consultation Suite 1' },
    consultationMode: { type: String, default: 'In-Person' },
    onlineSessionLink: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'Scheduled',
      index: true
    },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

// Pre-save hook to synchronize doctorId/clinicianId and doctorName/clinicianName
AppointmentSchema.pre('save', function (this: IAppointment) {
  if (!this.clinicianId && this.doctorId) this.clinicianId = this.doctorId;
  if (!this.doctorId && this.clinicianId) this.doctorId = this.clinicianId;
  if (!this.clinicianName && this.doctorName) this.clinicianName = this.doctorName;
  if (!this.doctorName && this.clinicianName) this.doctorName = this.clinicianName;

  if (!this.onlineSessionLink && (this.consultationMode?.toLowerCase().includes('online') || this.consultationMode?.toLowerCase().includes('tele') || this.appointmentType?.toLowerCase().includes('online'))) {
    const cleanId = (this.appointmentId || 'apt').toLowerCase();
    this.onlineSessionLink = `https://meet.vancepsychiatry.com/room/session-${cleanId}`;
  }
});

// Compound indexes required by prompt
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
AppointmentSchema.index({ clinicianId: 1, appointmentDate: 1 });
AppointmentSchema.index({ patientId: 1, appointmentDate: 1 });
AppointmentSchema.index({ appointmentDate: 1, status: 1 });

const Appointment: Model<IAppointment> = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;
