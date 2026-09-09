import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Patient from '@/models/Patient';
import Appointment from '@/models/Appointment';
import Consultation from '@/models/Consultation';
import Prescription from '@/models/Prescription';
import FollowUp from '@/models/FollowUp';
import { PatientSchema } from '@/lib/validators';
import { authorizeUser } from '@/lib/permissions';

// GET /api/patients/[id] - Get patient detail with related clinical history
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    await dbConnect();

    // Query by patientId (PX-XXXX) or _id
    const patient = await Patient.findOne({
      $or: [{ patientId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Fetch related records
    const [appointments, consultations, prescriptions, followUps] = await Promise.all([
      Appointment.find({ patientId: patient.patientId }).sort({ appointmentDate: -1 }).lean(),
      Consultation.find({ patientId: patient.patientId }).sort({ consultationDate: -1 }).lean(),
      Prescription.find({ patientId: patient.patientId }).sort({ prescriptionDate: -1 }).lean(),
      FollowUp.find({ patientId: patient.patientId }).sort({ followUpDate: -1 }).lean(),
    ]);

    const formattedPatient = {
      ...patient,
      id: patient.patientId,
    };

    return NextResponse.json({
      success: true,
      data: {
        patient: formattedPatient,
        appointments: appointments.map(a => ({ ...a, id: a.appointmentId })),
        consultations: consultations.map(c => ({ ...c, id: c.consultationId })),
        prescriptions: prescriptions.map(p => ({ ...p, id: p.prescriptionId })),
        followUps: followUps.map(f => ({ ...f, id: f.followUpId })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json(
      { success: false, error: 'Database error fetching patient chart.' },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[id] - Edit patient record
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

    const patient = await Patient.findOne({
      $or: [{ patientId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    Object.assign(patient, body);
    await patient.save();

    const formatted = {
      ...patient.toObject(),
      id: patient.patientId,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
      message: 'Patient updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update patient record.' },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - Delete patient record
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    await dbConnect();

    const patient = await Patient.findOneAndDelete({
      $or: [{ patientId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Patient ${patient.fullName} (${patient.patientId}) deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete patient record.' },
      { status: 500 }
    );
  }
}
