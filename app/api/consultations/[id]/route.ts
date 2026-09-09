import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Consultation from '@/models/Consultation';
import { authorizeUser } from '@/lib/permissions';

// GET /api/consultations/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    await dbConnect();

    const consultation = await Consultation.findOne({
      $or: [{ consultationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!consultation) {
      return NextResponse.json(
        { success: false, error: 'Consultation record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...consultation,
        id: consultation.consultationId,
        date: consultation.consultationDate,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch consultation details.' },
      { status: 500 }
    );
  }
}

// PUT /api/consultations/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR']);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    await dbConnect();
    const body = await req.json();

    const consultation = await Consultation.findOne({
      $or: [{ consultationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!consultation) {
      return NextResponse.json(
        { success: false, error: 'Consultation record not found' },
        { status: 404 }
      );
    }

    Object.assign(consultation, body);
    await consultation.save();

    return NextResponse.json({
      success: true,
      data: {
        ...consultation.toObject(),
        id: consultation.consultationId,
        date: consultation.consultationDate,
      },
      message: 'Consultation record updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update consultation record.' },
      { status: 500 }
    );
  }
}
