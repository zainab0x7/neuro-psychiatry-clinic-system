import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// View clinic settings allowed for all authenticated roles
router.get('/', requireRole('ADMIN', 'DOCTOR', 'RECEPTION', 'THERAPIST'), getSettings);

// Update clinic settings restricted strictly to ADMIN
router.put('/', requireRole('ADMIN'), updateSettings);

export default router;
