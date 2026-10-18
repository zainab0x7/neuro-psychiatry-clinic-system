import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Consultation from '@/models/Consultation';
import Patient from '@/models/Patient';
import Prescription from '@/models/Prescription';
import FollowUp from '@/models/FollowUp';
import ClinicSettings from '@/models/ClinicSettings';
import { ConsultationSchema } from '@/lib/validators';
import { authorizeUser } from '@/lib/permissions';

// Helper to sanitize clinical notes for Reception role
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

// GET /api/patients/[patientId]/consultations
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

    const consultations = await Consultation.find({ patientId: patient.patientId })
      .sort({ consultationDate: -1, createdAt: -1 })
      .lean();

    const isReception = auth.session?.role === 'RECEPTION' || auth.session?.role === 'RECEPTIONIST';

    const formatted = consultations.map((c: any) => {
      const item = {
        ...c,
        id: c.consultationId,
        date: c.consultationDate,
      };
      return isReception ? sanitizeForReception(item) : item;
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching patient consultations:', error);
    return NextResponse.json(
      { success: false, error: 'Database error fetching patient consultation records.' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[patientId]/consultations
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
    if (body.date && !body.consultationDate) body.consultationDate = body.date;

    const validation = ConsultationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const consultData = validation.data;

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

    const consultationDate = consultData.consultationDate || consultData.date || new Date().toISOString().split('T')[0];

    const count = await Consultation.countDocuments();
    let candidateNum = 5001 + count;
    let consultationId = `CNS-${candidateNum}`;

    while (await Consultation.exists({ consultationId })) {
      candidateNum++;
      consultationId = `CNS-${candidateNum}`;
    }

    const doctorId = auth.session?.userId || consultData.doctorId || 'USR-001';
    const doctorName = auth.session?.name || consultData.doctorName || 'DR SHAHAB MUHAMMAD';

    const newConsultation = new Consultation({
      ...consultData,
      consultationId,
      patientId: patient.patientId,
      patientName: patient.fullName,
      doctorId,
      doctorName,
      clinicianId: doctorId,
      clinicianName: doctorName,
      consultationDate,
    });

    await newConsultation.save();

    // Auto-create prescription if medications present
    if (consultData.medications && consultData.medications.length > 0) {
      const settings = await ClinicSettings.findOne();
      const rxCount = await Prescription.countDocuments();
      const prescriptionId = `RX-${900 + rxCount + 1}`;

      const newRx = new Prescription({
        prescriptionId,
        patientId: patient.patientId,
        patientName: patient.fullName,
        patientAge: patient.age,
        patientGender: patient.gender,
        doctorId,
        doctorName,
        doctorLicense: settings?.licenseNumber || 'NY-MED-849201',
        prescriptionDate: consultationDate,
        diagnosis: `${consultData.diagnosis.primaryTitle} (${consultData.diagnosis.primaryICD})`,
        medications: consultData.medications,
        treatmentPlan: consultData.treatmentPlan,
        status: 'Active',
      });

      await newRx.save();
    }

    // Auto-create FollowUp record if specified
    if (consultData.followUpDate) {
      const flpCount = await FollowUp.countDocuments();
      const followUpId = `FLP-${300 + flpCount + 1}`;

      const todayStr = new Date().toISOString().split('T')[0];
      let status: 'Due' | 'Upcoming' | 'Overdue' = 'Upcoming';
      if (consultData.followUpDate === todayStr) status = 'Due';
      else if (consultData.followUpDate < todayStr) status = 'Overdue';

      const newFlp = new FollowUp({
        followUpId,
        patientId: patient.patientId,
        patientName: patient.fullName,
        phone: patient.phone,
        doctorId,
        assignedDoctor: doctorName,
        consultationId,
        lastConsultationDate: consultationDate,
        followUpDate: consultData.followUpDate,
        reason: consultData.followUpNotes || `Clinical follow-up for ${consultData.diagnosis.primaryTitle}`,
        priority: 'Routine',
        status,
        notes: consultData.followUpNotes || '',
      });

      await newFlp.save();
    }

    // Update Patient lastVisitDate and nextFollowUpDate
    patient.lastVisitDate = consultationDate;
    if (consultData.followUpDate) {
      patient.nextFollowUpDate = consultData.followUpDate;
    }
    await patient.save();

    const formatted = {
      ...newConsultation.toObject(),
      id: newConsultation.consultationId,
      date: newConsultation.consultationDate,
    };

    return NextResponse.json(
      {
        success: true,
        data: formatted,
        message: `Clinical consultation record saved for ${patient.fullName}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error saving consultation:', error);
    return NextResponse.json(
      { success: false, error: 'Database error saving consultation record.' },
      { status: 500 }
    );
  }
}
