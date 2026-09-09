import { NextResponse } from 'next/server';
import { getSession, SessionPayload } from './auth';
import { UserRole } from '@/models/User';

export async function authorizeUser(allowedRoles?: UserRole[]): Promise<{
  authorized: boolean;
  session?: SessionPayload;
  response?: NextResponse;
}> {
  const session = await getSession();

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Session missing or expired' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      session,
      response: NextResponse.json(
        { success: false, error: `Forbidden: Role ${session.role} is not authorized for this operation` },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}
