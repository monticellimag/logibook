import { db } from '@/db';
import { bookings, bays } from '@/db/schema';
import { eq, and, inArray, ne, sql } from 'drizzle-orm';
import { format } from 'date-fns';

export type BayState = 'free' | 'occupied' | 'maintenance';

export type BayDetails = {
  computedState: BayState;
  activeTransit: {
    id: string;
    licensePlate: string;
    carrierName?: string;
    operationType?: string;
    pallets?: number;
    startedAt?: string;
  } | null;
  queuedCount: number;
  queuedTransits: { id: string; licensePlate: string; time: string; operationType?: string }[];
  maxQueue: number;
};

export async function getBayState(bayId: string): Promise<BayState> {
  const details = await getBayDetails(bayId);
  return details.computedState;
}

export async function getBayDetails(bayId: string): Promise<BayDetails> {
  const [bay] = await db.select().from(bays).where(eq(bays.id, bayId));
  
  if (!bay) {
    return {
      computedState: 'free',
      activeTransit: null,
      queuedCount: 0,
      queuedTransits: [],
      maxQueue: 5,
    };
  }

  if (bay.status === 'maintenance') {
    return {
      computedState: 'maintenance',
      activeTransit: null,
      queuedCount: 0,
      queuedTransits: [],
      maxQueue: 5,
    };
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  // Active transit in this bay: pick the single earliest active booking
  const activeBookings = await db
    .select({
      id: bookings.id,
      licensePlate: bookings.licensePlate,
      carrierName: bookings.carrierName,
      operationType: bookings.operationType,
      pallets: bookings.pallets,
      operationStartedAt: bookings.operationStartedAt,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.bayId, bayId),
        eq(bookings.date, today),
        inArray(bookings.gateStatus, ['arrived', 'loading', 'unloading'])
      )
    )
    .orderBy(bookings.operationStartedAt)
    .limit(1);

  const activeId = activeBookings[0]?.id;

  // Queued transits: any non-completed booking assigned to this bay that is NOT the active one
  const queuedBookings = await db
    .select({
      id: bookings.id,
      licensePlate: bookings.licensePlate,
      time: bookings.time,
      operationType: bookings.operationType,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.bayId, bayId),
        eq(bookings.date, today),
        ne(bookings.gateStatus, 'completed'),
        activeId ? ne(bookings.id, activeId) : sql`1=1`
      )
    )
    .orderBy(bookings.time)
    .limit(5);

  const active = activeBookings[0]
    ? {
        id: activeBookings[0].id,
        licensePlate: activeBookings[0].licensePlate,
        carrierName: activeBookings[0].carrierName || undefined,
        operationType: activeBookings[0].operationType || undefined,
        pallets: activeBookings[0].pallets ?? 0,
        startedAt: activeBookings[0].operationStartedAt || undefined,
      }
    : null;

  return {
    computedState: active ? 'occupied' : 'free',
    activeTransit: active,
    queuedCount: queuedBookings.length,
    queuedTransits: queuedBookings.map((b) => ({
      id: b.id,
      licensePlate: b.licensePlate,
      time: b.time,
      operationType: b.operationType || undefined,
    })),
    maxQueue: 5,
  };
}
