import { Router } from 'express';
import { getAuditLogs, createAuditLog } from '../controllers/auditController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication to all audit log routes
router.use(authenticate);

// GET /api/audit-logs - ADMIN only
router.get('/', requireRole('ADMIN'), getAuditLogs);

// POST /api/audit-logs - Authenticated staff members can log audit events
router.post('/', createAuditLog);

export default router;

