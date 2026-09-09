import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { UserSchema } from '@/lib/validators';
import { authorizeUser } from '@/lib/permissions';

// GET /api/users - List system staff members
export async function GET() {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const users = await User.find().select('-passwordHash').sort({ createdAt: 1 }).lean();

    const formatted = users.map(u => ({
      ...u,
      id: u.userId,
      status: u.isActive ? 'ACTIVE' : 'INACTIVE',
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Database error fetching staff directory.' },
      { status: 500 }
    );
  }
}

// POST /api/users - Admin register new staff user
export async function POST(req: Request) {
  try {
    const auth = await authorizeUser(['ADMIN', 'DOCTOR']); // Admin/Doctor access
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const body = await req.json();

    const validation = UserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const userData = validation.data;

    // Check if email already exists
    const existing = await User.findOne({ email: userData.email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists.' },
        { status: 400 }
      );
    }

    // Generate unique userId (USR-00X)
    const count = await User.countDocuments();
    const userId = `USR-00${count + 1}`;

    // Hash password
    const plainPassword = userData.password || 'VancePractice2026!';
    const passwordHash = await hashPassword(plainPassword);

    const permissions = {
      canWriteClinicalNotes: userData.role === 'DOCTOR',
      canPrescribe: userData.role === 'DOCTOR',
      canManagePatients: true,
      canManageAppointments: true,
      canManageUsers: userData.role === 'ADMIN',
      canViewReports: userData.role !== 'RECEPTIONIST',
    };

    const newUser = new User({
      userId,
      name: userData.name,
      email: userData.email.toLowerCase(),
      passwordHash,
      role: userData.role,
      phone: userData.phone || '',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: userData.title || (userData.role === 'DOCTOR' ? 'Consultant Psychiatrist' : userData.role === 'RECEPTIONIST' ? 'Clinical Coordinator' : 'Practice Director'),
      department: userData.department || (userData.role === 'DOCTOR' ? 'Neuropsychiatry' : 'Practice Administration'),
      permissions,
      isActive: true,
      lastActive: 'Never',
    });

    await newUser.save();

    const formatted = {
      ...newUser.toObject(),
      id: newUser.userId,
      status: newUser.isActive ? 'ACTIVE' : 'INACTIVE',
    };
    delete (formatted as any).passwordHash;

    return NextResponse.json({
      success: true,
      data: formatted,
      message: `Staff user ${newUser.name} created with role ${newUser.role}`,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user account.' },
      { status: 500 }
    );
  }
}
