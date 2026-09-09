import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Appointment from '@/models/Appointment';
import Patient from '@/models/Patient';
import ClinicSettings from '@/models/ClinicSettings';
import { AppointmentSchema } from '@/lib/validators';
import { authorizeUser } from '@/lib/permissions';

// GET /api/appointments - List appointments with filters
export async function GET(req: Request) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    const filter: any = {};
    if (date) filter.appointmentDate = date;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .lean();

    const formatted = appointments.map(a => ({
      ...a,
      id: a.appointmentId,
      date: a.appointmentDate,
      time: a.appointmentTime,
      type: a.appointmentType,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Database error fetching appointments.' },
      { status: 500 }
    );
  }
}

// Helper to convert HH:MM AM/PM to minutes from midnight
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleanStr = timeStr.trim();
  
  // 24hr format like "08:30"
  if (/^\d{1,2}:\d{2}$/.test(cleanStr)) {
    const [h, m] = cleanStr.split(':').map(Number);
    return h * 60 + m;
  }
  
  // 12hr format like "09:00 AM" or "02:30 PM"
  const match = cleanStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
}

// POST /api/appointments - Book appointment with clinic rules & double booking checks
export async function POST(req: Request) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const body = await req.json();

    // Map UI field names if necessary
    if (body.date && !body.appointmentDate) body.appointmentDate = body.date;
    if (body.time && !body.appointmentTime) body.appointmentTime = body.time;
    if (body.type && !body.appointmentType) body.appointmentType = body.type;

    const validation = AppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const appData = validation.data;

    // 1. Validate Patient
    const patient = await Patient.findOne({ patientId: appData.patientId });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: `Invalid patient data: Patient ${appData.patientId} not found.` },
        { status: 404 }
      );
    }

    // 2. Validate Clinic Working Hours & Breaks
    const settings = await ClinicSettings.findOne() || {
      clinicStartTime: '08:30',
      clinicEndTime: '17:30',
      breakStartTime: '12:30',
      breakEndTime: '13:30',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    };

    const appMinutes = timeToMinutes(appData.appointmentTime);
    const startMinutes = timeToMinutes(settings.clinicStartTime || '08:30');
    const endMinutes = timeToMinutes(settings.clinicEndTime || '17:30');
    const breakStartMinutes = timeToMinutes(settings.breakStartTime || '12:30');
    const breakEndMinutes = timeToMinutes(settings.breakEndTime || '13:30');

    if (appMinutes < startMinutes || appMinutes >= endMinutes) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid appointment time. Clinic operating hours are ${settings.clinicStartTime} to ${settings.clinicEndTime}.` 
        },
        { status: 400 }
      );
    }

    if (appMinutes >= breakStartMinutes && appMinutes < breakEndMinutes) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid appointment time. Practice break time is between ${settings.breakStartTime} and ${settings.breakEndTime}.` 
        },
        { status: 400 }
      );
    }

    // 3. Prevent Double Booking for doctor, date & time
    const existing = await Appointment.findOne({
      doctorId: appData.doctorId,
      appointmentDate: appData.appointmentDate,
      appointmentTime: appData.appointmentTime,
      status: { $ne: 'Cancelled' },
    });

    if (existing) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Appointment already booked for ${appData.doctorName} on ${appData.appointmentDate} at ${appData.appointmentTime}.` 
        },
        { status: 409 }
      );
    }

    // Generate unique appointment ID
    const count = await Appointment.countDocuments();
    const appointmentId = `APT-${1000 + count + 1}`;

    const newAppointment = new Appointment({
      ...appData,
      appointmentId,
      patientName: patient.fullName,
      patientPhone: patient.phone,
    });

    await newAppointment.save();

    // Update patient nextFollowUpDate
    patient.nextFollowUpDate = appData.appointmentDate;
    await patient.save();

    const formatted = {
      ...newAppointment.toObject(),
      id: newAppointment.appointmentId,
      date: newAppointment.appointmentDate,
      time: newAppointment.appointmentTime,
      type: newAppointment.appointmentType,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
      message: `Appointment confirmed for ${patient.fullName} on ${appData.appointmentDate} at ${appData.appointmentTime}.`,
    });
  } catch (error: any) {
    console.error('Error booking appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Database error booking appointment.' },
      { status: 500 }
    );
  }
}
