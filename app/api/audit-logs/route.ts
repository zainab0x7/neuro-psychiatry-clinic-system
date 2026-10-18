import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AuditLog from '@/models/AuditLog';
import { authorizeUser } from '@/lib/permissions';

/**
 * Sanitizes metadata objects to remove sensitive keys (passwords, tokens, credentials, secrets).
 */
function sanitizeAuditData(obj: any): any {
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
 * Safely generates a unique logId (LOG-XXXX) ensuring no index collisions occur.
 */
async function generateUniqueLogId(preferredId?: string): Promise<string> {
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
}

// GET /api/audit-logs - ADMIN-only endpoint to retrieve audit logs
export async function GET(req: Request) {
  try {
    const auth = await authorizeUser(['ADMIN'], req);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get('module');
    const userRole = searchParams.get('role');
    const action = searchParams.get('action');

    const filter: any = {};
    if (moduleName && moduleName !== 'All') filter.module = moduleName;
    if (userRole && userRole !== 'All') filter.userRole = userRole;
    if (action && action !== 'All') filter.action = action;

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    const formatted = logs.map((l) => ({
      ...l,
      id: l.logId,
    }));

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/audit-logs - Authenticated endpoint to log audit events
export async function POST(req: Request) {
  try {
    const auth = await authorizeUser(undefined, req);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const body = await req.json();

    // Strip out top-level sensitive fields
    delete body.password;
    delete body.passwordHash;
    delete body.token;
    delete body.secret;
    delete body.credentials;

    const logId = await generateUniqueLogId(body.id || body.logId);
    const timestamp = body.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sanitizedMetadata = sanitizeAuditData(body.metadata || {});

    const action = body.action || 'UNKNOWN';
    const moduleName = body.module || 'SYSTEM';

    const newLog = new AuditLog({
      logId,
      timestamp,
      userId: body.userId || auth.session?.userId || 'SYSTEM',
      userName: body.userName || auth.session?.name || 'System Process',
      userRole: body.userRole || auth.session?.role || 'SYSTEM',
      action,
      module: moduleName,
      resourceType: body.resourceType || moduleName || '',
      resourceId: body.resourceId || '',
      patientRef: body.patientRef || '',
      description: body.description || `${action} on ${moduleName}`,
      metadata: sanitizedMetadata,
    });

    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      try {
        await newLog.save();
        break;
      } catch (saveErr: any) {
        if (saveErr.code === 11000 || saveErr.message?.includes('E11000')) {
          attempts++;
          if (attempts >= maxAttempts) throw saveErr;
          const count = await AuditLog.countDocuments();
          newLog.logId = `LOG-${1000 + count + attempts + Math.floor(Math.random() * 100)}`;
        } else {
          throw saveErr;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: { ...newLog.toObject(), id: newLog.logId },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

