import { Request, Response, NextFunction } from 'express';
import AuditLog from '../../models/AuditLog';
import { recordAuditEvent, sanitizeAuditData } from '../utils/auditLogger';

/**
 * GET /api/audit-logs
 * ADMIN-only endpoint to retrieve paginated, filtered audit logs.
 */
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = (req.query.search || req.query.q || '').toString().trim();
    const action = (req.query.action || '').toString().trim();
    const moduleName = (req.query.module || req.query.resourceType || '').toString().trim();
    const user = (req.query.user || req.query.userId || '').toString().trim();
    const startDate = (req.query.startDate || req.query.from || '').toString().trim();
    const endDate = (req.query.endDate || req.query.to || '').toString().trim();

    const page = Math.max(1, parseInt((req.query.page || '1').toString(), 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit || '50').toString(), 10)));

    const filter: Record<string, any> = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { logId: searchRegex },
        { description: searchRegex },
        { userName: searchRegex },
        { userId: searchRegex },
        { patientRef: searchRegex },
      ];
    }

    if (action && action !== 'All') {
      filter.action = action;
    }

    if (moduleName && moduleName !== 'All') {
      filter.module = moduleName;
    }

    if (user && user !== 'All') {
      filter.$or = [
        { userId: user },
        { userName: new RegExp(user, 'i') },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const toDate = new Date(endDate);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    const total = await AuditLog.countDocuments(filter);
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        total,
      },
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/audit-logs
 * Authenticated endpoint to record an audit log event in MongoDB.
 */
export const createAuditLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    const body = req.body || {};

    const action = body.action || 'UNKNOWN';
    const moduleName = body.module || 'SYSTEM';
    const description = body.description || `${action} on ${moduleName}`;

    const metadata = sanitizeAuditData(body.metadata || {});

    const logEntry = await recordAuditEvent({
      preferredId: body.id || body.logId,
      userId: body.userId || user?.userId || user?.id || 'SYSTEM',
      userName: body.userName || user?.name || 'System Process',
      userRole: body.userRole || user?.role || 'SYSTEM',
      action,
      module: moduleName,
      resourceType: body.resourceType || moduleName,
      resourceId: body.resourceId || '',
      patientRef: body.patientRef || '',
      description,
      metadata,
    });

    if (!logEntry) {
      res.status(500).json({ success: false, error: 'Failed to save audit log entry.' });
      return;
    }

    res.status(201).json({
      success: true,
      data: { ...logEntry.toObject(), id: logEntry.logId },
    });
  } catch (error) {
    next(error);
  }
};

