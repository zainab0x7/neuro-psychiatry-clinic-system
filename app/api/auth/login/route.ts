import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { verifyPassword, createSessionCookie } from '@/lib/auth';
import { LoginSchema } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User account is deactivated. Contact practice admin.' },
        { status: 403 }
      );
    }

    // Verify bcrypt password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update lastActive timestamp
    user.lastActive = 'Just now';
    await user.save();

    // Create session cookie
    await createSessionCookie({
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
    });

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
      message: `Welcome back, ${user.name}`,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
