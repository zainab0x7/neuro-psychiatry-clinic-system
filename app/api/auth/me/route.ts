import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ userId: session.userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User record not found' },
        { status: 404 }
      );
    }

    const userResponse = {
      id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      title: user.title,
      department: user.department,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      lastActive: user.lastActive,
      permissions: user.permissions,
    };

    return NextResponse.json({
      success: true,
      data: userResponse,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve current user session' },
      { status: 500 }
    );
  }
}
