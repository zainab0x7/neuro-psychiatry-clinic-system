import { Router } from "express";
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController";
import { authenticate, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Protect all appointment routes
router.use(authenticate);

// GET /api/appointments
router.get("/", requireRole("ADMIN", "DOCTOR", "RECEPTION", "RECEPTIONIST", "THERAPIST"), getAppointments);

// GET /api/appointments/:id
router.get("/:id", requireRole("ADMIN", "DOCTOR", "RECEPTION", "RECEPTIONIST", "THERAPIST"), getAppointmentById);

// POST /api/appointments
router.post("/", requireRole("ADMIN", "DOCTOR", "RECEPTION", "RECEPTIONIST"), createAppointment);

// PUT /api/appointments/:id
router.put("/:id", requireRole("ADMIN", "DOCTOR", "RECEPTION", "RECEPTIONIST"), updateAppointment);

// DELETE /api/appointments/:id
router.delete("/:id", requireRole("ADMIN", "DOCTOR", "RECEPTION", "RECEPTIONIST"), deleteAppointment);

export default router;
