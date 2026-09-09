import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ClinicSettings from '@/models/ClinicSettings';
import { ClinicSettingsSchema } from '@/lib/validators';
import { authorizeUser } from '@/lib/permissions';

// GET /api/settings - Fetch practice configuration & operating hours
export async function GET() {
  try {
    const auth = await authorizeUser(['DOCTOR', 'RECEPTIONIST', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();

    let settings = await ClinicSettings.findOne().lean();
    if (!settings) {
      const defaultSettings = new ClinicSettings();
      await defaultSettings.save();
      settings = defaultSettings.toObject();
    }

    const formatted = {
      ...settings,
      clinicStart: settings.clinicStartTime,
      clinicEnd: settings.clinicEndTime,
      slotDurationMinutes: settings.appointmentDuration,
      breakStart: settings.breakStartTime,
      breakEnd: settings.breakEndTime,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Database error fetching practice settings.' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update practice configuration
export async function PUT(req: Request) {
  try {
    const auth = await authorizeUser(['ADMIN', 'DOCTOR']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();
    const body = await req.json();

    if (body.clinicStart && !body.clinicStartTime) body.clinicStartTime = body.clinicStart;
    if (body.clinicEnd && !body.clinicEndTime) body.clinicEndTime = body.clinicEnd;
    if (body.slotDurationMinutes && !body.appointmentDuration) body.appointmentDuration = body.slotDurationMinutes;
    if (body.breakStart && !body.breakStartTime) body.breakStartTime = body.breakStart;
    if (body.breakEnd && !body.breakEndTime) body.breakEndTime = body.breakEnd;

    const validation = ClinicSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const settingsData = validation.data;

    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = new ClinicSettings(settingsData);
    } else {
      Object.assign(settings, settingsData);
    }

    await settings.save();

    const formatted = {
      ...settings.toObject(),
      clinicStart: settings.clinicStartTime,
      clinicEnd: settings.clinicEndTime,
      slotDurationMinutes: settings.appointmentDuration,
      breakStart: settings.breakStartTime,
      breakEnd: settings.breakEndTime,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
      message: 'Clinic operating parameters and settings updated.',
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update practice settings.' },
      { status: 500 }
    );
  }
}
