import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Prescription from '@/models/Prescription';
import Patient from '@/models/Patient';
import ClinicSettings from '@/models/ClinicSettings';
import { PrescriptionSchema } from '@/lib/validators';
import { authorizeUser } from '@/lib/permissions';

// GET /api/prescriptions
export async function GET(req: Request) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');

    const filter: any = {};
    if (patientId) filter.patientId = patientId;

    const prescriptions = await Prescription.find(filter)
      .sort({ prescriptionDate: -1 })
      .lean();

    const formatted = prescriptions.map(p => ({
      ...p,
      id: p.prescriptionId,
      dateIssued: p.prescriptionDate,
      treatmentNotes: p.treatmentPlan || p.treatmentNotes,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Database error fetching prescriptions.' },
      { status: 500 }
    );
  }
}

// POST /api/prescriptions - Generate standalone prescription
export async function POST(req: Request) {
  try {
    const auth = await authorizeUser(['DOCTOR']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const body = await req.json();

    if (body.dateIssued && !body.prescriptionDate) body.prescriptionDate = body.dateIssued;
    if (body.treatmentNotes && !body.treatmentPlan) body.treatmentPlan = body.treatmentNotes;

    const validation = PrescriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const rxData = validation.data;

    // Validate Patient
    const patient = await Patient.findOne({ patientId: rxData.patientId });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: `Patient ${rxData.patientId} not found.` },
        { status: 404 }
      );
    }

    const settings = await ClinicSettings.findOne();
    const count = await Prescription.countDocuments();
    const prescriptionId = `RX-${900 + count + 1}`;

    const newPrescription = new Prescription({
      ...rxData,
      prescriptionId,
      patientName: patient.fullName,
      patientAge: patient.age,
      patientGender: patient.gender,
      prescriptionDate: rxData.prescriptionDate || rxData.dateIssued || new Date().toISOString().split('T')[0],
      doctorLicense: settings?.licenseNumber || 'NY-MED-849201',
    });

    await newPrescription.save();

    const formatted = {
      ...newPrescription.toObject(),
      id: newPrescription.prescriptionId,
      dateIssued: newPrescription.prescriptionDate,
      treatmentNotes: newPrescription.treatmentPlan,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
      message: `Prescription ${newPrescription.prescriptionId} issued for ${patient.fullName}`,
    });
  } catch (error: any) {
    console.error('Error issuing prescription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to issue prescription.' },
      { status: 500 }
    );
  }
}
