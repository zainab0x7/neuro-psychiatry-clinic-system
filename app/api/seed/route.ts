import { NextResponse } from 'next/server';
import { runSeed } from '@/lib/seed';

export async function POST() {
  const isProd = process.env.NODE_ENV === 'production';
  const allowProdSeed = process.env.ALLOW_PRODUCTION_SEED === 'true';

  if (isProd && !allowProdSeed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden: Automatic database seeding is disabled in production environments to protect live clinical data.',
      },
      { status: 403 }
    );
  }

  try {
    const counts = await runSeed();
    return NextResponse.json({
      success: true,
      data: counts,
      message: 'Database seeded successfully with staff accounts, demo patients, appointments, consultations, prescriptions, follow-ups, and clinic settings.',
    });
  } catch (error: any) {
    console.error('Database seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Database seeding failed: ' + (error.message || error) },
      { status: 500 }
    );
  }
}
