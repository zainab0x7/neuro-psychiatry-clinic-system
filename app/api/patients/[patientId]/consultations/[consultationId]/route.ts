import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Consultation from '@/models/Consultation';
import Patient from '@/models/Patient';
import { authorizeUser } from '@/lib/permissions';

function sanitizeForReception(c: any) {
  return {
    ...c,
    presentingComplaint: '[Restricted: Clinical Note Access Limited for Reception]',
    clinicalObservations: '[Restricted: Clinical Note Access Limited for Reception]',
    treatmentPlan: '[Restricted: Clinical Note Access Limited for Reception]',
    notes: '[Restricted: Clinical Note Access Limited for Reception]',
    followUpNotes: '[Restricted: Clinical Note Access Limited for Reception]',
    mentalStatusExam: {
      appearance: '[Restricted]',
      behavior: '[Restricted]',
      speech: '[Restricted]',
      moodAndAffect: '[Restricted]',
      thoughtProcess: '[Restricted]',
      thoughtContent: '[Restricted]',
      perception: '[Restricted]',
      cognition: '[Restricted]',
      insightAndJudgment: '[Restricted]',
    },
  };
}

// GET /api/patients/[patientId]/consultations/[consultationId]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ patientId: string; consultationId: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'RECEPTION', 'ADMIN', 'THERAPIST']);
    if (!auth.authorized) return auth.response!;

    const { patientId, consultationId } = await params;
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

    const isValidConsultObjectId = /^[0-9a-fA-F]{24}$/.test(consultationId);
    const consultation = await Consultation.findOne({
      $or: [{ consultationId }, { _id: isValidConsultObjectId ? consultationId : null }],
      patientId: patient.patientId,
    }).lean();

    if (!consultation) {
      return NextResponse.json(
        { success: false, error: `Consultation record not found for ID: ${consultationId}` },
        { status: 404 }
      );
    }

    const isReception = auth.session?.role === 'RECEPTION' || auth.session?.role === 'RECEPTIONIST';
    const formatted = {
      ...consultation,
      id: consultation.consultationId,
      date: consultation.consultationDate,
    };
    const data = isReception ? sanitizeForReception(formatted) : formatted;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch consultation details.' },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[patientId]/consultations/[consultationId]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ patientId: string; consultationId: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    const { patientId, consultationId } = await params;
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

    const isValidConsultObjectId = /^[0-9a-fA-F]{24}$/.test(consultationId);
    const consultation = await Consultation.findOne({
      $or: [{ consultationId }, { _id: isValidConsultObjectId ? consultationId : null }],
      patientId: patient.patientId,
    });

    if (!consultation) {
      return NextResponse.json(
        { success: false, error: `Consultation record not found for ID: ${consultationId}` },
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
