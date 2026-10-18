import { Router } from "express";
import { login, logout, getCurrentUser, createUser } from "../controllers/authController";
import { authenticate, requireRole } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validationMiddleware";
import { loginSchema, createUserSchema } from "../utils/authValidation";

const router = Router();

// Public Authentication Route (Login)
router.post("/login", validateRequest(loginSchema), login);

// Protected Routes (Require Authentication)
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getCurrentUser);

// Admin-Only Route (User Creation & Management)
router.post(
  "/users",
  authenticate,
  requireRole("ADMIN"),
  validateRequest(createUserSchema),
  createUser
);

export default router;
