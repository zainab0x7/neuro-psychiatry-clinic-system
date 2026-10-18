import { Router } from 'express';
import { exportClinicData, getBackupLogs, createBackup } from '../controllers/backupController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication & Admin restriction to all backup & export routes
router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/export', exportClinicData);
router.get('/', getBackupLogs);
router.post('/', createBackup);

export default router;
