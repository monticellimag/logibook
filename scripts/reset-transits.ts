import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function resetTransits() {
  console.log('Deleting test bookings completely from DB...');
  try {
    const { db } = await import('../src/db');
    const { bookings } = await import('../src/db/schema');
    const { inArray } = await import('drizzle-orm');

    // Completely delete test bookings
    await db.delete(bookings).where(inArray(bookings.licensePlate, ['AA123BB', 'AA124BB', 'AA144BB', 'EE444EE', 'BB1114BB']));
    
    // Also reset any remaining bookings to expected with no bay
    await db.update(bookings).set({
      gateStatus: 'expected',
      bay: null,
      bayId: null,
      operationStartedAt: null,
      completedAt: null,
      isEmergency: false,
    });

    console.log('Successfully deleted test bookings and reset all transits!');
  } catch (err) {
    console.error('Error resetting transits:', err);
  }
  process.exit(0);
}

resetTransits();
