import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentDoc extends Document {
  paymentId: string;
  receiptNumber: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  consultationId?: string;
  feeCategoryId?: string;
  service: string;
  feeCategory: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  date: string;
  paymentDate?: string;
  notes?: string;
  receivedBy?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema<IPaymentDoc> = new Schema(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    receiptNumber: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    appointmentId: { type: String, default: '' },
    consultationId: { type: String, default: '' },
    feeCategoryId: { type: String, default: '' },
    service: { type: String, required: true },
    feeCategory: { type: String, default: 'Consultation' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Cash' },
    paymentStatus: { type: String, default: 'Paid', index: true },
    date: { type: String, required: true, index: true },
    paymentDate: { type: String, default: '' },
    notes: { type: String, default: '' },
    receivedBy: { type: String, default: '' },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

// Indexes for analytical report queries
PaymentSchema.index({ date: 1, paymentStatus: 1 });
PaymentSchema.index({ patientId: 1, date: -1 });

const Payment: Model<IPaymentDoc> =
  mongoose.models.Payment || mongoose.model<IPaymentDoc>('Payment', PaymentSchema);

export default Payment;

