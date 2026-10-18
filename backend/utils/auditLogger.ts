import AuditLog, { IAuditLogDoc } from '../../models/AuditLog';
import { logger } from './logger';

export interface LogAuditParams {
  preferredId?: string;
  userId: string;
  userName?: string;
  userRole?: string;
  action: string;
  module: string;
  resourceType?: string;
  resourceId?: string;
  patientRef?: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Sanitizes metadata objects to remove sensitive keys (passwords, tokens, credentials, secrets).
 */
export function sanitizeAuditData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeAuditData);

  const sanitized: Record<string, any> = {};
  const SENSITIVE_KEYS = ['password', 'passwordhash', 'token', 'jwt', 'secret', 'credentials', 'authorization', 'cookie', 'session'];

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      continue;
    }
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Safe sequential Audit Log ID generator (LOG-XXXX format)
 */
const generateLogId = async (preferredId?: string): Promise<string> => {
  if (preferredId && typeof preferredId === 'string' && preferredId.startsWith('LOG-')) {
    const exists = await AuditLog.exists({ logId: preferredId });
    if (!exists) return preferredId;
  }

  const highestLog = await AuditLog.findOne({ logId: /^LOG-\d+$/ })
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  let maxNum = 1000;
  if (highestLog?.logId) {
    const match = highestLog.logId.match(/^LOG-(\d+)$/);
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
  }

  const count = await AuditLog.countDocuments();
  let candidateNum = Math.max(maxNum + 1, 1001 + count);
  let candidateId = `LOG-${candidateNum}`;

  while (await AuditLog.exists({ logId: candidateId })) {
    candidateNum++;
    candidateId = `LOG-${candidateNum}`;
  }

  return candidateId;
};

/**
 * Asynchronously records a system audit event in MongoDB.
 * Never throws or blocks main request execution.
 */
export const recordAuditEvent = async (params: LogAuditParams): Promise<IAuditLogDoc | null> => {
  try {
    let logId = await generateLogId(params.preferredId);
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sanitizedMetadata = sanitizeAuditData(params.metadata || {});

    const logEntry = new AuditLog({
      logId,
      timestamp,
      userId: params.userId || 'SYSTEM',
      userName: params.userName || 'System Process',
      userRole: params.userRole || 'SYSTEM',
      action: params.action,
      module: params.module,
      resourceType: params.resourceType || params.module,
      resourceId: params.resourceId || '',
      patientRef: params.patientRef || '',
      description: params.description,
      metadata: sanitizedMetadata,
    });

    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      try {
        await logEntry.save();
        break;
      } catch (saveErr: any) {
        if (saveErr.code === 11000 || saveErr.message?.includes('E11000')) {
          attempts++;
          if (attempts >= maxAttempts) throw saveErr;
          const count = await AuditLog.countDocuments();
          logId = `LOG-${1000 + count + attempts + Math.floor(Math.random() * 100)}`;
          logEntry.logId = logId;
        } else {
          throw saveErr;
        }
      }
    }

    logger.info(`[AUDIT] ${params.action} on ${params.module} by ${params.userId}: ${params.description}`);
    return logEntry;
  } catch (error: any) {
    logger.error('Failed to save audit log entry:', error.message || error);
    return null;
  }
};

