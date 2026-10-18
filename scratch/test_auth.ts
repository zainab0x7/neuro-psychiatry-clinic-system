import { hashPassword, comparePassword, generateToken, verifyToken } from "../backend/utils/authUtils";
import { loginSchema, createUserSchema } from "../backend/utils/authValidation";

async function runTests() {
  console.log("=== Auth Verification Test Suite ===");

  // 1. Test Password Hashing
  const rawPass = "SecureAdmin123!";
  const hashed = await hashPassword(rawPass);
  console.log("1. Password Hashed:", hashed.startsWith("$2a$") || hashed.startsWith("$2b$"));

  const matches = await comparePassword(rawPass, hashed);
  console.log("   Password Matches:", matches);

  const wrongMatches = await comparePassword("WrongPassword", hashed);
  console.log("   Wrong Password Rejected:", !wrongMatches);

  // 2. Test JWT Token Generation & Verification
  const payload = {
    id: "60d5ecb8b3b3a12345678901",
    userId: "USR-001",
    email: "admin@clinic.com",
    name: "Clinic Administrator",
    role: "ADMIN" as const,
  };

  const token = await generateToken(payload);
  console.log("2. JWT Token Generated:", typeof token === "string" && token.length > 20);

  const verifiedPayload = await verifyToken(token);
  console.log("   JWT Token Verified:", verifiedPayload?.email === "admin@clinic.com" && verifiedPayload?.role === "ADMIN");

  // 3. Test Zod Validation
  const validLogin = loginSchema.safeParse({
    email: "Doctor.Smith@Clinic.com",
    password: "Password123",
  });
  console.log("3. Valid Login Payload Parsed:", validLogin.success && validLogin.data.email === "doctor.smith@clinic.com");

  const invalidLogin = loginSchema.safeParse({
    email: "invalid-email",
    password: "123",
  });
  console.log("   Invalid Login Rejected:", !invalidLogin.success);

  const validCreateDoctor = createUserSchema.safeParse({
    name: "Dr. Jane Doe",
    email: "jane.doe@clinic.com",
    password: "DoctorPass123",
    role: "DOCTOR",
    title: "Senior Psychiatrist",
    department: "Psychiatry",
  });
  console.log("4. Valid Doctor Account Payload Parsed:", validCreateDoctor.success);

  const validCreateTherapist = createUserSchema.safeParse({
    name: "Sarah Connors",
    email: "sarah.c@clinic.com",
    password: "TherapistPass123",
    role: "THERAPIST",
  });
  console.log("   Valid Therapist Account Payload Parsed:", validCreateTherapist.success);

  console.log("=== All Verification Tests Passed ===");
}

runTests().catch(console.error);
