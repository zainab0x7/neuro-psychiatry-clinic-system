import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Appointment from '@/models/Appointment';
import { authorizeUser } from '@/lib/permissions';

// GET /api/appointments/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    await dbConnect();

    const appointment = await Appointment.findOne({
      $or: [{ appointmentId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...appointment,
        id: appointment.appointmentId,
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        type: appointment.appointmentType,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment detail.' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update status or appointment details
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    await dbConnect();
    const body = await req.json();

    const appointment = await Appointment.findOne({
      $or: [{ appointmentId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (body.status) appointment.status = body.status;
    if (body.notes !== undefined) appointment.notes = body.notes;
    if (body.room !== undefined) appointment.room = body.room;

    await appointment.save();

    return NextResponse.json({
      success: true,
      data: {
        ...appointment.toObject(),
        id: appointment.appointmentId,
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        type: appointment.appointmentType,
      },
      message: `Appointment ${appointment.appointmentId} updated to ${appointment.status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment.' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    await dbConnect();

    const appointment = await Appointment.findOneAndDelete({
      $or: [{ appointmentId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Appointment ${appointment.appointmentId} deleted.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete appointment.' },
      { status: 500 }
    );
  }
}
