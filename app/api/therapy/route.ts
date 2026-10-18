import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TherapySession from '@/models/TherapySession';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const therapistId = searchParams.get('therapistId');

    const filter: any = {};
    if (patientId) filter.patientId = patientId;
    if (therapistId) filter.therapistId = therapistId;

    const sessions = await TherapySession.find(filter).sort({ createdAt: -1 }).lean();
    const formatted = sessions.map(s => ({
      ...s,
      id: s.sessionId,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const count = await TherapySession.countDocuments();
    const sessionId = body.id || `TS-${Math.floor(700 + count + 1)}`;

    const newSession = new TherapySession({
      ...body,
      sessionId,
    });
    await newSession.save();

    return NextResponse.json({
      success: true,
      data: { ...newSession.toObject(), id: newSession.sessionId },
      message: 'Therapy session documentation saved.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
