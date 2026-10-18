import { z } from 'zod';

export const createTherapySessionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID cannot be empty.'),
  sessionDate: z.string().min(1, 'Session date cannot be empty.'),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute.').default(50),
  sessionType: z.string().min(1, 'Session type cannot be empty.'),
  
  therapistId: z.string().optional(),
  therapistName: z.string().optional(),
  patientName: z.string().optional(),
  
  assessment: z.string().optional().default(''),
  clinicalAssessment: z.string().optional().default(''),
  counselling: z.string().optional().default(''),
  intervention: z.string().optional().default(''),
  interventionsUsed: z.any().optional(),
  progressNotes: z.string().optional().default(''),
  psychometrics: z.string().optional().default(''),
  lifestyleInterventions: z.string().optional().default(''),
  followUpPlan: z.string().optional().default(''),
  planForNextSession: z.string().optional().default(''),
  followUpDate: z.string().optional().default(''),
  sessionTime: z.string().optional().default('02:00 PM'),
  responsibleClinician: z.string().optional().default(''),
  responsibleClinicianId: z.string().optional().default(''),
  
  status: z.enum(['Completed', 'Scheduled', 'Draft']).default('Completed'),
}).passthrough();

export const updateTherapySessionSchema = createTherapySessionSchema.partial();
