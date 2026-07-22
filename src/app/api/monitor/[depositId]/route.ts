import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bays, bookings } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { getBayState, getBayDetails } from '@/lib/bay-status';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ depositId: string }> }
) {
  try {
    const { depositId } = await params;

    // Fetch bays for the deposit
    const depotBays = await db
      .select()
      .from(bays)
      .where(eq(bays.depositId, depositId))
      .orderBy(bays.bayNumber);

    // Calculate state & queue details for each bay
    const baysWithState = await Promise.all(
      depotBays.map(async (bay) => {
        const details = await getBayDetails(bay.id);
        return {
          ...bay,
          ...details,
        };
      })
    );

    // Fetch all today's transits for the table
    const today = format(new Date(), 'yyyy-MM-dd');
    const allTransits = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.depotId, depositId),
          eq(bookings.date, today)
        )
      );

    // Normalize transits: Ensure ONLY 1 active transit per bay and place any extra arrived transits into queue
    const activePerBay: Record<string, typeof allTransits> = {};
    allTransits.forEach((t) => {
      if (t.bayId && ['arrived', 'loading', 'unloading'].includes(t.gateStatus || '')) {
        if (!activePerBay[t.bayId]) activePerBay[t.bayId] = [];
        activePerBay[t.bayId].push(t);
      }
    });

    const activeIds = new Set<string>();
    const queuedPerBay: Record<string, typeof allTransits> = {};

    Object.keys(activePerBay).forEach((bId) => {
      const list = activePerBay[bId];
      list.sort((a, b) => (a.operationStartedAt || a.time).localeCompare(b.operationStartedAt || b.time));
      activeIds.add(list[0].id); // 1st started is the primary active transit
      if (list.length > 1) {
        if (!queuedPerBay[bId]) queuedPerBay[bId] = [];
        queuedPerBay[bId].push(...list.slice(1));
      }
    });

    allTransits.forEach((t) => {
      if (t.bayId && t.gateStatus !== 'completed' && !activeIds.has(t.id)) {
        if (!queuedPerBay[t.bayId]) queuedPerBay[t.bayId] = [];
        if (!queuedPerBay[t.bayId].some((x) => x.id === t.id)) {
          queuedPerBay[t.bayId].push(t);
        }
      }
    });

    const isEmerg = (val: any) => Boolean(val && val !== 0 && val !== '0' && val !== 'false');

    Object.keys(queuedPerBay).forEach((bId) => {
      queuedPerBay[bId].sort((a, b) => {
        const pA = isEmerg(a.isEmergency) ? 1 : 0;
        const pB = isEmerg(b.isEmergency) ? 1 : 0;
        if (pA !== pB) return pB - pA; // Priority first!
        const timeA = a.operationStartedAt || a.createdAt || a.time;
        const timeB = b.operationStartedAt || b.createdAt || b.time;
        return timeA.localeCompare(timeB);
      });
    });

    const transitsWithQueueInfo = allTransits.map((t) => {
      let effectiveGateStatus = t.gateStatus || 'expected';
      let queuePos = 0;
      let totalQueue = 0;

      if (t.bayId && t.gateStatus !== 'completed') {
        if (activeIds.has(t.id)) {
          effectiveGateStatus = 'arrived';
        } else if (queuedPerBay[t.bayId]) {
          effectiveGateStatus = 'expected';
          const list = queuedPerBay[t.bayId];
          const idx = list.findIndex((x) => x.id === t.id);
          if (idx !== -1) {
            queuePos = idx + 1;
            totalQueue = list.length;
          }
        }
      }

      return {
        ...t,
        gateStatus: effectiveGateStatus,
        queuePos,
        totalQueue,
        isEmergency: isEmerg(t.isEmergency) ? 1 : 0,
      };
    });

    // Filter out unassigned expected bookings (IN ATTESA without bay) so they don't clutter the Live Monitor
    const monitorTransits = transitsWithQueueInfo.filter(
      (t) => t.gateStatus === 'completed' || Boolean(t.bayId) || ['arrived', 'loading', 'unloading'].includes(t.gateStatus)
    );

    // Custom sorting:
    // 1. IN CORSO (arrived, loading, unloading) -> Priority 1
    // 2. ATTESA POSIZIONAMENTO (expected with bay) -> Priority 2 (Sorted by queuePos asc: 1/2 before 2/2)
    // 3. COMPLETATI (completed) -> Priority 3
    monitorTransits.sort((a, b) => {
      const getPriority = (t: typeof monitorTransits[0]) => {
        const status = t.gateStatus || '';
        if (['arrived', 'loading', 'unloading'].includes(status)) return 1;
        if (status === 'expected' && t.bayId) return 2;
        return 3; // completed
      };

      const prioA = getPriority(a);
      const prioB = getPriority(b);

      if (prioA !== prioB) {
        return prioA - prioB;
      }

      if (prioA === 1) {
        // IN CORSO: most recent started first
        return (b.operationStartedAt || b.time).localeCompare(a.operationStartedAt || a.time);
      }
      if (prioA === 2) {
        // ATTESA POSIZIONAMENTO: sort by queuePos (1/2 before 2/2)
        return a.queuePos - b.queuePos;
      }
      if (prioA === 3) {
        // COMPLETATI: most recent completed first
        return (b.completedAt || b.time).localeCompare(a.completedAt || a.time);
      }
      return a.time.localeCompare(b.time);
    });

    return NextResponse.json({
      bays: baysWithState,
      transits: monitorTransits
    });
  } catch (error) {
    console.error('Error fetching monitor data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
