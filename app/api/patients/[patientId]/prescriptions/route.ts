import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Prescription from '@/models/Prescription';
import Patient from '@/models/Patient';
import ClinicSettings from '@/models/ClinicSettings';
import { PrescriptionSchema } from '@/lib/validators';
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

// GET /api/patients/[patientId]/prescriptions
export async function GET(
  req: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'RECEPTION', 'ADMIN', 'THERAPIST']);
    if (!auth.authorized) return auth.response!;

    const { patientId } = await params;
    await dbConnect();

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(patientId);
    const patient = await Patient.findOne({
      $or: [{ patientId }, { _id: isValidObjectId ? patientId : null }],
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: `Patient record not found for ID: ${patientId}` },
        { status: 404 }
      );
    }

    const prescriptions = await Prescription.find({ patientId: patient.patientId })
      .sort({ prescriptionDate: -1, createdAt: -1 })
      .lean();

    const isReception = auth.session?.role === 'RECEPTION' || auth.session?.role === 'RECEPTIONIST';
    const formatted = prescriptions.map((r: any) => {
      const item = {
        ...r,
        id: r.prescriptionId,
        dateIssued: r.prescriptionDate || r.dateIssued,
      };
      return isReception ? sanitizeForReception(item) : item;
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching patient prescriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Database error fetching prescription records.' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[patientId]/prescriptions
export async function POST(
  req: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    const { patientId } = await params;
    await dbConnect();
    const body = await req.json();

    body.patientId = patientId;
    if (body.dateIssued && !body.prescriptionDate) body.prescriptionDate = body.dateIssued;

    const validation = PrescriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const rxData = validation.data;

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(patientId);
    const patient = await Patient.findOne({
      $or: [{ patientId }, { _id: isValidObjectId ? patientId : null }],
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: `Patient record not found for ID: ${patientId}` },
        { status: 404 }
      );
    }

    const settings = await ClinicSettings.findOne();
    const count = await Prescription.countDocuments();
    let candidateNum = 901 + count;
    let prescriptionId = `RX-${candidateNum}`;

    while (await Prescription.exists({ prescriptionId })) {
      candidateNum++;
      prescriptionId = `RX-${candidateNum}`;
    }

    const doctorId = auth.session?.userId || rxData.doctorId || 'USR-001';
    const doctorName = auth.session?.name || rxData.doctorName || 'DR SHAHAB MUHAMMAD';
    const doctorLicense = rxData.doctorLicense || settings?.licenseNumber || 'NY-MED-849201';
    const prescriptionDate = rxData.prescriptionDate || rxData.dateIssued || new Date().toISOString().split('T')[0];

    const newPrescription = new Prescription({
      ...rxData,
      prescriptionId,
      patientId: patient.patientId,
      patientName: patient.fullName,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorId,
      doctorName,
      clinicianId: doctorId,
      clinicianName: doctorName,
      doctorLicense,
      prescriptionDate,
      dateIssued: prescriptionDate,
    });

    await newPrescription.save();

    const formatted = {
      ...newPrescription.toObject(),
      id: newPrescription.prescriptionId,
      dateIssued: newPrescription.prescriptionDate,
    };

    return NextResponse.json(
      {
        success: true,
        data: formatted,
        message: `Prescription ${prescriptionId} issued successfully for ${patient.fullName}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error issuing prescription:', error);
    return NextResponse.json(
      { success: false, error: 'Database error creating prescription record.' },
      { status: 500 }
    );
  }
}
