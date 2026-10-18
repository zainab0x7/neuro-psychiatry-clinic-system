import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
});

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
  role: z.enum(["ADMIN", "DOCTOR", "RECEPTION", "RECEPTIONIST", "THERAPIST"]),
  phone: z.string().optional().default(""),
  title: z.string().optional().default(""),
  department: z.string().optional().default(""),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
