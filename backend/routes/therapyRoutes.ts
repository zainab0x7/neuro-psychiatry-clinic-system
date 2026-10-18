import { Router } from "express";
import {
  getPatientTherapySessions,
  getTherapySessionById,
  createTherapySession,
  updateTherapySession,
} from "../controllers/therapyController";
import { authenticate, requireRole } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validationMiddleware";
import {
  createTherapySessionSchema,
  updateTherapySessionSchema,
} from "../utils/therapyValidation";

const router = Router();

// Require authentication for all therapy routes
router.use(authenticate);

// Global / standalone therapy session endpoints
router.get(
  "/",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  getPatientTherapySessions
);

router.get(
  "/sessions",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  getPatientTherapySessions
);

router.get(
  "/:sessionId",
  requireRole("ADMIN", "DOCTOR", "RECEPTION", "THERAPIST"),
  getTherapySessionById
);

router.post(
  "/",
  requireRole("ADMIN", "DOCTOR", "THERAPIST"),
  validateRequest(createTherapySessionSchema),
  createTherapySession
);

router.post(
  "/sessions",
  requireRole("ADMIN", "DOCTOR", "THERAPIST"),
  validateRequest(createTherapySessionSchema),
  createTherapySession
);

router.put(
  "/:sessionId",
  requireRole("ADMIN", "DOCTOR", "THERAPIST"),
  validateRequest(updateTherapySessionSchema),
  updateTherapySession
);

export default router;
