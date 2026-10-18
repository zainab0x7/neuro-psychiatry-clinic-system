import { NextResponse } from 'next/server';
import { getSession, SessionPayload } from './auth';
import { UserRole } from '@/models/User';

export async function authorizeUser(allowedRoles?: UserRole[], req?: Request): Promise<{
  authorized: boolean;
  session?: SessionPayload;
  response?: NextResponse;
}> {
  const session = await getSession(req);

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Session missing or expired' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const isAuthorized = allowedRoles.some((role) => {
      if (role === 'RECEPTION' && session.role === 'RECEPTIONIST') return true;
      if (role === 'RECEPTIONIST' && session.role === 'RECEPTION') return true;
      return role === session.role;
    });

    if (!isAuthorized) {
      return {
        authorized: false,
        session,
        response: NextResponse.json(
          { success: false, error: `Forbidden: Role ${session.role} is not authorized for this operation` },
          { status: 403 }
        ),
      };
    }
  }

  return { authorized: true, session };
}

