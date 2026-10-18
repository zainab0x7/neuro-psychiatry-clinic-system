import { Router } from "express";
import {
  getPatientConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
} from "../controllers/consultationController";
import { authenticate, requireRole } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validationMiddleware";
import { createConsultationSchema, updateConsultationSchema } from "../utils/consultationValidation";

const router = Router();

router.use(authenticate);

// GET /api/consultations
router.get(
  "/",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  getPatientConsultations
);

// GET /api/consultations/:id
router.get(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  getConsultationById
);

// POST /api/consultations (ADMIN, DOCTOR)
router.post(
  "/",
  requireRole("ADMIN", "DOCTOR"),
  validateRequest(createConsultationSchema),
  createConsultation
);

// PUT /api/consultations/:id (ADMIN, DOCTOR)
router.put(
  "/:id",
  requireRole("ADMIN", "DOCTOR"),
  validateRequest(updateConsultationSchema),
  updateConsultation
);

export default router;
