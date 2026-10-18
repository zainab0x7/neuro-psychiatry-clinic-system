import { z } from "zod";

export const createPatientSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters long")
    .trim(),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required"),
  age: z
    .number()
    .min(0, "Age must be a positive number")
    .optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]),
  phone: z
    .string()
    .min(5, "Phone number must be at least 5 characters long")
    .trim(),
  email: z
    .string()
    .email("Invalid email format")
    .or(z.literal(""))
    .optional(),
  address: z.string().optional().default(""),
  status: z
    .enum(["Active", "In Treatment", "Discharged", "Pending Intake"])
    .optional()
    .default("Active"),
  emergencyContact: z
    .object({
      name: z.string().optional().default(""),
      relationship: z.string().optional().default(""),
      phone: z.string().optional().default(""),
    })
    .optional(),
  clinicalIntake: z
    .object({
      presentingComplaint: z.string().optional().default(""),
      psychiatricHistory: z.string().optional().default(""),
      currentMedications: z.string().optional().default(""),
      allergies: z.string().optional().default(""),
      familyHistory: z.string().optional().default(""),
      riskAssessment: z.enum(["Low", "Moderate", "High"]).optional().default("Low"),
    })
    .optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
