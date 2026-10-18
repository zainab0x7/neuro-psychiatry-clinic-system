import { z } from "zod";

export const createConsultationSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required").trim(),
  patientName: z.string().optional(),
  doctorId: z.string().optional(),
  doctorName: z.string().optional(),
  clinicianId: z.string().optional(),
  clinicianName: z.string().optional(),
  consultationDate: z.string().optional(),
  time: z.string().optional().default("10:00 AM"),
  visitType: z.string().optional().default("Follow-up Consultation"),
  presentingComplaint: z.string().min(1, "Presenting complaint is required"),
  clinicalObservations: z.string().min(1, "Clinical observations are required"),
  mentalStatusExam: z
    .object({
      appearance: z.string().optional().default(""),
      behavior: z.string().optional().default(""),
      speech: z.string().optional().default(""),
      moodAndAffect: z.string().optional().default(""),
      thoughtProcess: z.string().optional().default(""),
      thoughtContent: z.string().optional().default(""),
      perception: z.string().optional().default(""),
      cognition: z.string().optional().default(""),
      insightAndJudgment: z.string().optional().default(""),
    })
    .optional(),
  assessment: z.string().min(1, "Assessment is required"),
  diagnosis: z.object({
    primaryICD: z.string().min(1, "Primary ICD code is required"),
    primaryTitle: z.string().min(1, "Primary diagnosis title is required"),
    secondaryICD: z.string().optional().default(""),
    secondaryTitle: z.string().optional().default(""),
  }),
  treatmentPlan: z.string().min(1, "Treatment plan is required"),
  medications: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Medication name is required"),
        dosage: z.string().min(1, "Dosage is required"),
        frequency: z.string().min(1, "Frequency is required"),
        duration: z.string().min(1, "Duration is required"),
        instructions: z.string().optional().default(""),
        refills: z.number().optional().default(0),
      })
    )
    .optional()
    .default([]),
  followUpDate: z.string().optional().default(""),
  followUpNotes: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const updateConsultationSchema = createConsultationSchema.partial();

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;
