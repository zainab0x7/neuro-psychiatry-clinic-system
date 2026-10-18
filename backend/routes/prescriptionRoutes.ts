import { Router } from "express";
import {
  getPatientPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  reusePrescription,
} from "../controllers/prescriptionController";
import { authenticate, requireRole } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validationMiddleware";
import { createPrescriptionSchema, updatePrescriptionSchema } from "../utils/prescriptionValidation";

const router = Router();

router.use(authenticate);

// GET /api/prescriptions
router.get(
  "/",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  getPatientPrescriptions
);

// GET /api/prescriptions/:id
router.get(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  getPrescriptionById
);

// POST /api/prescriptions (ADMIN, DOCTOR)
router.post(
  "/",
  requireRole("ADMIN", "DOCTOR"),
  validateRequest(createPrescriptionSchema),
  createPrescription
);

// POST /api/prescriptions/:id/reuse
router.post(
  "/:id/reuse",
  requireRole("ADMIN", "DOCTOR"),
  reusePrescription
);

// PUT /api/prescriptions/:id (ADMIN, DOCTOR)
router.put(
  "/:id",
  requireRole("ADMIN", "DOCTOR"),
  validateRequest(updatePrescriptionSchema),
  updatePrescription
);

export default router;
