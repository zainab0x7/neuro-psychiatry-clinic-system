import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { authorizeUser } from '@/lib/permissions';

// PUT /api/users/[id] - Update user role & permissions
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser(['ADMIN']);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    await dbConnect();
    const body = await req.json();

    const user = await User.findOne({
      $or: [{ userId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Staff user not found' },
        { status: 404 }
      );
    }

    if (body.role) {
      user.role = body.role;
      user.permissions = {
        canWriteClinicalNotes: body.role === 'DOCTOR',
        canPrescribe: body.role === 'DOCTOR',
        canManagePatients: true,
        canManageAppointments: true,
        canManageUsers: body.role === 'ADMIN',
        canViewReports: body.role !== 'RECEPTIONIST',
      };
    }

    if (body.name) user.name = body.name;
    if (body.phone !== undefined) user.phone = body.phone;
    if (body.title !== undefined) user.title = body.title;
    if (body.department !== undefined) user.department = body.department;
    if (body.isActive !== undefined) user.isActive = body.isActive;

    await user.save();

    const formatted = {
      ...user.toObject(),
      id: user.userId,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
    };
    delete (formatted as any).passwordHash;

    return NextResponse.json({
      success: true,
      data: formatted,
      message: `User ${user.name} role updated to ${user.role}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update user role.' },
      { status: 500 }
    );
  }
}
