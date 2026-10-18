import { z } from 'zod';

export const createFeeCategorySchema = z.object({
  name: z.string().min(1, 'Fee category name is required.'),

  defaultFee: z.number().positive('Fee amount must be a positive monetary value (> 0).'),

  amount: z.number().positive().optional(),
  description: z.string().optional().default(''),
  isActive: z.boolean().default(true),
});

export const updateFeeCategorySchema = z.object({
  name: z.string().min(1).optional(),
  defaultFee: z.number().positive().optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createPaymentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required.'),

  patientName: z.string().optional(),
  appointmentId: z.string().optional(),
  consultationId: z.string().optional(),
  feeCategoryId: z.string().optional(),
  service: z.string().optional().default('Consultation Service'),
  feeCategory: z.string().optional().default('Consultation'),

  amount: z.number().positive('Payment amount must be a positive monetary value (> 0).'),

  paymentMethod: z.string().default('Cash'),

  paymentStatus: z.string().default('Paid'),
  date: z.string().optional(),
  paymentDate: z.string().optional(),
  notes: z.string().optional().default(''),
});

export const updatePaymentSchema = z.object({
  paymentStatus: z.string().optional(),
  notes: z.string().optional(),
  amount: z.number().positive().optional(),
  paymentMethod: z.string().optional(),
});
