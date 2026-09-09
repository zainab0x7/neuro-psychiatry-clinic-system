import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Patient from '@/models/Patient';
import { PatientSchema } from '@/lib/validators';
import { authorizeUser } from '@/lib/permissions';

// GET /api/patients - Search & list paginated patients
export async function GET(req: Request) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('search') || '';
    const gender = searchParams.get('gender') || 'All';
    const status = searchParams.get('status') || 'All';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const filter: any = {};

    if (query.trim()) {
      const regex = new RegExp(query.trim(), 'i');
      filter.$or = [
        { patientId: regex },
        { fullName: regex },
        { phone: regex },
      ];
    }

    if (gender !== 'All') {
      filter.gender = gender;
    }

    if (status !== 'All') {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const [patients, total] = await Promise.all([
      Patient.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Patient.countDocuments(filter),
    ]);

    const formattedPatients = patients.map(p => ({
      ...p,
      id: p.patientId,
    }));

    return NextResponse.json({
      success: true,
      data: formattedPatients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Database error fetching patient records.' },
      { status: 500 }
    );
  }
}

// POST /api/patients - Register new patient
export async function POST(req: Request) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const body = await req.json();

    const validation = PatientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const patientData = validation.data;

    // Generate unique patientId (PX-XXXX)
    let patientId = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const count = await Patient.countDocuments();
      const randomNum = Math.floor(9400 + count + attempts);
      patientId = `PX-${randomNum}`;
      const existing = await Patient.findOne({ patientId });
      if (!existing) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      patientId = `PX-${Date.now().toString().slice(-4)}`;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const newPatient = new Patient({
      ...patientData,
      patientId,
      registeredDate: patientData.registeredDate || todayStr,
      lastVisitDate: patientData.lastVisitDate || 'N/A',
      nextFollowUpDate: patientData.nextFollowUpDate || 'N/A',
    });

    await newPatient.save();

    const responseData = {
      ...newPatient.toObject(),
      id: newPatient.patientId,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `Patient ${newPatient.fullName} registered successfully with ID ${newPatient.patientId}`,
    });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create patient record in database.' },
      { status: 500 }
    );
  }
}
