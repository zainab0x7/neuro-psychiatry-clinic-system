import { runSeed } from '../lib/seed';

async function main() {
  const isProd = process.env.NODE_ENV === 'production';
  const hasForceFlag = process.argv.includes('--force-production-seed');

  if (isProd && !hasForceFlag) {
    console.error(`
====================================================================
🔴 CRITICAL SAFETY WARNING: PRODUCTION ENVIRONMENT DETECTED
====================================================================
You are attempting to execute the demo data seed script in a PRODUCTION environment (NODE_ENV=production).

Running this script WILL PURGE all existing collections (Patients, Consultations, Prescriptions, Appointments, Financial Records) and insert sample demo records!

NEVER run this script on a live production database containing real patient data.

If you are absolutely certain you wish to purge and seed this database, re-run with:
  npx tsx scripts/seed.ts --force-production-seed
====================================================================
`);
    process.exit(1);
  }

  console.log('Seeding MongoDB database with demo data...');
  const counts = await runSeed();
  console.log('Seed completed successfully:', counts);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
