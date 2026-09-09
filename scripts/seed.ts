import { runSeed } from '../lib/seed';

async function main() {
  console.log('Seeding MongoDB database...');
  const counts = await runSeed();
  console.log('Seed completed successfully:', counts);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
