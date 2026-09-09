import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Prescription from '@/models/Prescription';
import { authorizeUser } from '@/lib/permissions';

// GET /api/prescriptions/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    await dbConnect();

    const prescription = await Prescription.findOne({
      $or: [{ prescriptionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: 'Prescription record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...prescription,
        id: prescription.prescriptionId,
        dateIssued: prescription.prescriptionDate,
        treatmentNotes: prescription.treatmentPlan || prescription.treatmentNotes,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescription details.' },
      { status: 500 }
    );
  }
}
