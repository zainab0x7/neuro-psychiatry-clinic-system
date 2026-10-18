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
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'RECEPTION', 'ADMIN', 'THERAPIST']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const doctorId = searchParams.get('doctorId') || searchParams.get('clinicianId') || searchParams.get('clinician');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const type = searchParams.get('type') || searchParams.get('appointmentType');
    const search = searchParams.get('search');

    const filter: any = {};
    if (date) {
      filter.appointmentDate = date;
    } else if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) filter.appointmentDate.$gte = startDate;
      if (endDate) filter.appointmentDate.$lte = endDate;
    }

    if (doctorId) {
      filter.$or = [{ doctorId }, { clinicianId: doctorId }];
    }

    if (patientId) filter.patientId = patientId;

    if (status) {
      if (status === 'Today') {
        filter.appointmentDate = new Date().toISOString().split('T')[0];
      } else if (status === 'Upcoming') {
        const todayStr = new Date().toISOString().split('T')[0];
        filter.appointmentDate = { $gte: todayStr };
        filter.status = { $nin: ['Completed', 'COMPLETED', 'Cancelled', 'CANCELLED'] };
      } else {
        filter.status = status;
      }
    }

    if (type) {
      filter.appointmentType = new RegExp(type, 'i');
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { patientName: searchRegex },
        { patientId: searchRegex },
        { appointmentType: searchRegex },
        { doctorName: searchRegex },
      ];
    }

    const appointments = await Appointment.find(filter)
      .sort({ appointmentDate: -1, appointmentTime: 1 })
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
      count: formatted.length,
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
  
  if (/^\d{1,2}:\d{2}$/.test(cleanStr)) {
    const [h, m] = cleanStr.split(':').map(Number);
    return h * 60 + m;
  }
  
  const match = cleanStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
}

// POST /api/appointments - Book appointment with conflict detection
export async function POST(req: Request) {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'RECEPTION', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const body = await req.json();

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

    // 2. Prevent Double Booking for doctor, date & time (with time overlap check)
    const newStart = timeToMinutes(appData.appointmentTime);
    const newEnd = newStart + (appData.durationMinutes || 45);

    const existingAppts = await Appointment.find({
      $or: [{ doctorId: appData.doctorId }, { clinicianId: appData.doctorId }],
      appointmentDate: appData.appointmentDate,
      status: { $nin: ['Cancelled', 'CANCELLED'] },
    });

    for (const appt of existingAppts) {
      const apptStart = timeToMinutes(appt.appointmentTime);
      const apptEnd = apptStart + (appt.durationMinutes || 45);

      if (newStart < apptEnd && apptStart < newEnd) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Time slot conflict: Doctor ${appData.doctorName} is already booked on ${appData.appointmentDate} at ${appData.appointmentTime}.` 
          },
          { status: 409 }
        );
      }
    }

    // Generate unique appointment ID
    const count = await Appointment.countDocuments();
    const appointmentId = `APT-${1000 + count + 1}`;

    const newAppointment = new Appointment({
      ...appData,
      appointmentId,
      clinicianId: appData.doctorId,
      clinicianName: appData.doctorName,
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
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error booking appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Database error booking appointment.' },
      { status: 500 }
    );
  }
}
