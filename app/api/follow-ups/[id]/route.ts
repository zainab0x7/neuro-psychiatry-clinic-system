import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FollowUp from '@/models/FollowUp';
import { authorizeUser } from '@/lib/permissions';

// PUT /api/follow-ups/[id] - Update status or follow-up note
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

    const followUp = await FollowUp.findOne({
      $or: [{ followUpId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!followUp) {
      return NextResponse.json(
        { success: false, error: 'Follow-up task not found' },
        { status: 404 }
      );
    }

    if (body.status) followUp.status = body.status;
    if (body.notes !== undefined) followUp.notes = body.notes;
    if (body.reason) followUp.reason = body.reason;

    await followUp.save();

    return NextResponse.json({
      success: true,
      data: {
        ...followUp.toObject(),
        id: followUp.followUpId,
        dueDate: followUp.followUpDate,
      },
      message: `Follow-up ${followUp.followUpId} updated to ${followUp.status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update follow-up task.' },
      { status: 500 }
    );
  }
}
