import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Prescription from '@/models/Prescription';
import Patient from '@/models/Patient';
import { authorizeUser } from '@/lib/permissions';

function sanitizeForReception(rx: any) {
  return {
    ...rx,
    treatmentNotes: '[Restricted: Clinical Note Access Limited for Reception]',
    treatmentPlan: '[Restricted: Clinical Note Access Limited for Reception]',
    instructions: '[Restricted: Clinical Note Access Limited for Reception]',
    medications: rx.medications?.map((m: any) => ({
      ...m,
      instructions: '[Restricted for Reception]',
    })),
  };
}

// GET /api/patients/[patientId]/prescriptions/[prescriptionId]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ patientId: string; prescriptionId: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'RECEPTION', 'ADMIN', 'THERAPIST']);
    if (!auth.authorized) return auth.response!;

    const { patientId, prescriptionId } = await params;
    await dbConnect();

    const isValidPatientObjectId = /^[0-9a-fA-F]{24}$/.test(patientId);
    const patient = await Patient.findOne({
      $or: [{ patientId }, { _id: isValidPatientObjectId ? patientId : null }],
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: `Patient record not found for ID: ${patientId}` },
        { status: 404 }
      );
    }

    const isValidRxObjectId = /^[0-9a-fA-F]{24}$/.test(prescriptionId);
    const rx = await Prescription.findOne({
      $or: [{ prescriptionId }, { _id: isValidRxObjectId ? prescriptionId : null }],
      patientId: patient.patientId,
    }).lean();

    if (!rx) {
      return NextResponse.json(
        { success: false, error: `Prescription record not found for ID: ${prescriptionId}` },
        { status: 404 }
      );
    }

    const isReception = auth.session?.role === 'RECEPTION' || auth.session?.role === 'RECEPTIONIST';
    const formatted = {
      ...rx,
      id: rx.prescriptionId,
      dateIssued: rx.prescriptionDate || rx.dateIssued,
    };
    const data = isReception ? sanitizeForReception(formatted) : formatted;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescription details.' },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[patientId]/prescriptions/[prescriptionId]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ patientId: string; prescriptionId: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    const { patientId, prescriptionId } = await params;
    await dbConnect();
    const body = await req.json();

    const isValidPatientObjectId = /^[0-9a-fA-F]{24}$/.test(patientId);
    const patient = await Patient.findOne({
      $or: [{ patientId }, { _id: isValidPatientObjectId ? patientId : null }],
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: `Patient record not found for ID: ${patientId}` },
        { status: 404 }
      );
    }

    const isValidRxObjectId = /^[0-9a-fA-F]{24}$/.test(prescriptionId);
    const rx = await Prescription.findOne({
      $or: [{ prescriptionId }, { _id: isValidRxObjectId ? prescriptionId : null }],
      patientId: patient.patientId,
    });

    if (!rx) {
      return NextResponse.json(
        { success: false, error: `Prescription record not found for ID: ${prescriptionId}` },
        { status: 404 }
      );
    }

    Object.assign(rx, body);
    await rx.save();

    return NextResponse.json({
      success: true,
      data: {
        ...rx.toObject(),
        id: rx.prescriptionId,
        dateIssued: rx.prescriptionDate || rx.dateIssued,
      },
      message: 'Prescription record updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update prescription record.' },
      { status: 500 }
    );
  }
}
