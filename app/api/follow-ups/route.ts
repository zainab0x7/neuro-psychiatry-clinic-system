import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FollowUp from '@/models/FollowUp';
import Patient from '@/models/Patient';
import { FollowUpSchema } from '@/lib/validators';
import { authorizeUser } from '@/lib/permissions';

// GET /api/follow-ups - List follow-ups with auto status calculation
export async function GET(req: Request) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const patientId = searchParams.get('patientId');

    const todayStr = new Date().toISOString().split('T')[0];

    // First fetch all follow-ups to compute dynamic date status (Due, Upcoming, Overdue)
    const rawFollowUps = await FollowUp.find().sort({ followUpDate: 1 }).lean();

    // Auto update status based on date if not already marked Completed
    const updatedFollowUps = await Promise.all(
      rawFollowUps.map(async (f) => {
        let currentStatus = f.status;
        if (currentStatus !== 'Completed' && currentStatus !== 'COMPLETED') {
          if (f.followUpDate === todayStr) {
            currentStatus = 'Due';
          } else if (f.followUpDate < todayStr) {
            currentStatus = 'Overdue';
          } else {
            currentStatus = 'Upcoming';
          }

          if (currentStatus !== f.status) {
            await FollowUp.updateOne({ _id: f._id }, { status: currentStatus });
          }
        }

        return {
          ...f,
          id: f.followUpId,
          dueDate: f.followUpDate,
          status: currentStatus,
        };
      })
    );

    let filtered = updatedFollowUps;

    if (patientId) {
      filtered = filtered.filter(f => f.patientId === patientId);
    }

    if (statusParam && statusParam !== 'All') {
      const targetStatus = statusParam.toLowerCase();
      filtered = filtered.filter(f => f.status.toLowerCase() === targetStatus);
    }

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (error: any) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json(
      { success: false, error: 'Database error fetching follow-up tasks.' },
      { status: 500 }
    );
  }
}

// POST /api/follow-ups - Create follow-up entry
export async function POST(req: Request) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const body = await req.json();

    if (body.dueDate && !body.followUpDate) body.followUpDate = body.dueDate;

    const validation = FollowUpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const flpData = validation.data;
    const patient = await Patient.findOne({ patientId: flpData.patientId });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: `Patient ${flpData.patientId} not found.` },
        { status: 404 }
      );
    }

    const count = await FollowUp.countDocuments();
    const followUpId = `FLP-${300 + count + 1}`;
    const followUpDate = flpData.followUpDate || flpData.dueDate || new Date().toISOString().split('T')[0];

    const todayStr = new Date().toISOString().split('T')[0];
    let status = flpData.status || 'Upcoming';
    if (status !== 'Completed' && status !== 'COMPLETED') {
      if (followUpDate === todayStr) status = 'Due';
      else if (followUpDate < todayStr) status = 'Overdue';
      else status = 'Upcoming';
    }

    const newFollowUp = new FollowUp({
      ...flpData,
      followUpId,
      patientName: patient.fullName,
      phone: patient.phone,
      followUpDate,
      status,
    });

    await newFollowUp.save();

    const formatted = {
      ...newFollowUp.toObject(),
      id: newFollowUp.followUpId,
      dueDate: newFollowUp.followUpDate,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
      message: `Follow-up created for ${patient.fullName} due on ${followUpDate}`,
    });
  } catch (error: any) {
    console.error('Error creating follow-up:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create follow-up task.' },
      { status: 500 }
    );
  }
}
