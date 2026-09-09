import { NextResponse } from 'next/server';
import { runSeed } from '@/lib/seed';

export async function POST() {
  try {
    const counts = await runSeed();
    return NextResponse.json({
      success: true,
      data: counts,
      message: 'Database seeded successfully with staff accounts, 10 patients, appointments, consultations, prescriptions, follow-ups, and clinic settings.',
    });
  } catch (error: any) {
    console.error('Database seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Database seeding failed: ' + (error.message || error) },
      { status: 500 }
    );
  }
}
