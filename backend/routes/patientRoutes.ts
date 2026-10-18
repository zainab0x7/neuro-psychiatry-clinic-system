import { Router } from "express";
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getClinicalRecords,
  createClinicalRecord,
} from "../controllers/patientController";
import {
  getPatientConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
} from "../controllers/consultationController";
import {
  getPatientPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  reusePrescription,
} from "../controllers/prescriptionController";
import { authenticate, requireRole } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validationMiddleware";
import { createPatientSchema, updatePatientSchema } from "../utils/patientValidation";
import { createConsultationSchema, updateConsultationSchema } from "../utils/consultationValidation";
import { createPrescriptionSchema, updatePrescriptionSchema } from "../utils/prescriptionValidation";

const router = Router();

// Apply authentication to all patient routes
router.use(authenticate);

// --- Patient Clinical Records Routes ---
router.get(
  "/:patientId/clinical-records",
  requireRole("ADMIN", "DOCTOR", "THERAPIST", "RECEPTION"),
  getClinicalRecords
);
router.post(
  "/:patientId/clinical-records",
  requireRole("ADMIN", "DOCTOR", "THERAPIST"),
  createClinicalRecord
);

// --- Patient Consultation Routes ---
router.get(
  "/:patientId/consultations",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  getPatientConsultations
);
router.get(
  "/:patientId/consultations/:consultationId",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  getConsultationById
);
router.post(
  "/:patientId/consultations",
  requireRole("ADMIN", "DOCTOR"),
  validateRequest(createConsultationSchema),
  createConsultation
);
router.put(
  "/:patientId/consultations/:consultationId",
  requireRole("ADMIN", "DOCTOR"),
  validateRequest(updateConsultationSchema),
  updateConsultation
);

// --- Patient Prescription Routes ---
router.get(
  "/:patientId/prescriptions",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  getPatientPrescriptions
);
router.get(
  "/:patientId/prescriptions/:prescriptionId",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  getPrescriptionById
);
router.post(
  "/:patientId/prescriptions",
  requireRole("ADMIN", "DOCTOR"),
  validateRequest(createPrescriptionSchema),
  createPrescription
);
router.post(
  "/:patientId/prescriptions/:prescriptionId/reuse",
  requireRole("ADMIN", "DOCTOR"),
  reusePrescription
);
router.put(
  "/:patientId/prescriptions/:prescriptionId",
  requireRole("ADMIN", "DOCTOR"),
  validateRequest(updatePrescriptionSchema),
  updatePrescription
);

// --- Patient Appointment Routes ---
router.get(
  "/:patientId/appointments",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  require("../controllers/appointmentController").getAppointments
);
router.get(
  "/:patientId/appointments/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  require("../controllers/appointmentController").getAppointmentById
);
router.post(
  "/:patientId/appointments",
  requireRole("ADMIN", "DOCTOR", "RECEPTION"),
  require("../controllers/appointmentController").createAppointment
);
router.put(
  "/:patientId/appointments/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTION"),
  require("../controllers/appointmentController").updateAppointment
);

// --- Patient Therapy Session Routes ---
router.get(
  "/:patientId/therapy-sessions",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  require("../controllers/therapyController").getPatientTherapySessions
);
router.get(
  "/:patientId/therapy-sessions/:sessionId",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  require("../controllers/therapyController").getTherapySessionById
);
router.post(
  "/:patientId/therapy-sessions",
  requireRole("ADMIN", "DOCTOR", "THERAPIST"),
  validateRequest(require("../utils/therapyValidation").createTherapySessionSchema),
  require("../controllers/therapyController").createTherapySession
);
router.put(
  "/:patientId/therapy-sessions/:sessionId",
  requireRole("ADMIN", "DOCTOR", "THERAPIST"),
  validateRequest(require("../utils/therapyValidation").updateTherapySessionSchema),
  require("../controllers/therapyController").updateTherapySession
);

// --- Patient Payment Routes ---
router.get(
  "/:patientId/payments",
  requireRole("ADMIN", "DOCTOR", "RECEPTION"),
  require("../controllers/billingController").getPatientPayments
);
// --- General Patient Routes ---
router.get("/", requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"), getPatients);
router.get("/:id", requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"), getPatientById);
router.post(
  "/",
  requireRole("ADMIN", "DOCTOR", "RECEPTION"),
  validateRequest(createPatientSchema),
  createPatient
);
router.put(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTION"),
  validateRequest(updatePatientSchema),
  updatePatient
);
router.delete("/:id", requireRole("ADMIN", "DOCTOR"), deletePatient);

export default router;
