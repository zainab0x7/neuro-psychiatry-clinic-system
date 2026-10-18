import { z } from "zod";

export const rxMedicationItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Medicine name is required").trim(),
  strength: z.string().optional().default(""),
  dosage: z.string().min(1, "Dosage / Strength is required").trim(),
  dose: z.string().optional().default(""),
  route: z.string().optional().default("Oral"),
  frequency: z.string().min(1, "Frequency is required").trim(),
  duration: z.string().min(1, "Duration is required").trim(),
  instructions: z.string().optional().default(""),
  refills: z.number().optional().default(0),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required").trim(),
  patientName: z.string().optional(),
  patientAge: z.number().optional().default(30),
  patientGender: z.string().optional().default("Other"),
  doctorId: z.string().optional(),
  doctorName: z.string().optional(),
  clinicianId: z.string().optional(),
  clinicianName: z.string().optional(),
  doctorLicense: z.string().optional().default(""),
  prescriptionDate: z.string().optional(),
  dateIssued: z.string().optional(),
  consultationId: z.string().optional().default(""),
  diagnosis: z.string().min(1, "Diagnosis is required").trim(),
  medications: z.array(rxMedicationItemSchema).min(1, "At least one medicine is required"),
  treatmentPlan: z.string().optional().default(""),
  treatmentNotes: z.string().optional().default(""),
  instructions: z.string().optional().default(""),
  status: z.enum(["Active", "Completed", "Discontinued"]).optional().default("Active"),
});

export const updatePrescriptionSchema = createPrescriptionSchema.partial();

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionSchema>;
