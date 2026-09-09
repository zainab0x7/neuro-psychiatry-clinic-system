import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Consultation from '@/models/Consultation';
import Patient from '@/models/Patient';
import Prescription from '@/models/Prescription';
import FollowUp from '@/models/FollowUp';
import ClinicSettings from '@/models/ClinicSettings';
import { ConsultationSchema } from '@/lib/validators';
import { authorizeUser } from '@/lib/permissions';

// GET /api/consultations
export async function GET(req: Request) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');

    const filter: any = {};
    if (patientId) filter.patientId = patientId;

    const consultations = await Consultation.find(filter)
      .sort({ consultationDate: -1 })
      .lean();

    const formatted = consultations.map(c => ({
      ...c,
      id: c.consultationId,
      date: c.consultationDate,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json(
      { success: false, error: 'Database error fetching consultation records.' },
      { status: 500 }
    );
  }
}

// POST /api/consultations - Submit clinical consultation entry
export async function POST(req: Request) {
  try {
    const auth = await authorizeUser(['DOCTOR']); // Doctor only
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const body = await req.json();

    if (body.date && !body.consultationDate) body.consultationDate = body.date;

    const validation = ConsultationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const consultData = validation.data;

    // 1. Validate Patient
    const patient = await Patient.findOne({ patientId: consultData.patientId });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: `Patient ${consultData.patientId} not found.` },
        { status: 404 }
      );
    }

    const consultationDate = consultData.consultationDate || consultData.date || new Date().toISOString().split('T')[0];

    // Generate unique consultation ID (CNS-XXXX)
    const count = await Consultation.countDocuments();
    const consultationId = `CNS-${5000 + count + 1}`;

    const newConsultation = new Consultation({
      ...consultData,
      consultationId,
      patientName: patient.fullName,
      consultationDate,
    });

    await newConsultation.save();

    // 2. Save Prescription automatically if medications exist
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
        doctorId: consultData.doctorId || 'USR-001',
        doctorName: consultData.doctorName || 'DR SHAHAB MUHAMMAD',
        doctorLicense: settings?.licenseNumber || 'NY-MED-849201',
        prescriptionDate: consultationDate,
        diagnosis: `${consultData.diagnosis.primaryTitle} (${consultData.diagnosis.primaryICD})`,
        medications: consultData.medications,
        treatmentPlan: consultData.treatmentPlan,
        status: 'Active',
      });

      await newRx.save();
    }

    // 3. Create FollowUp record if followUpDate specified
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
        doctorId: consultData.doctorId || 'USR-001',
        assignedDoctor: consultData.doctorName || 'DR SHAHAB MUHAMMAD',
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

    // 4. Update Patient lastVisitDate and nextFollowUpDate
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

    return NextResponse.json({
      success: true,
      data: formatted,
      message: `Clinical consultation record saved for ${patient.fullName}`,
    });
  } catch (error: any) {
    console.error('Error saving consultation:', error);
    return NextResponse.json(
      { success: false, error: 'Database error saving consultation.' },
      { status: 500 }
    );
  }
}
