import { NextResponse } from 'next/server';
import { db, bookings } from '@/db';
import { eq, and, sql, gte, asc } from 'drizzle-orm';
import { differenceInMinutes, parseISO } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const depotId = searchParams.get('depotId');

  try {
    let conditions = [eq(bookings.status, 'completed')];
    if (depotId) {
      conditions.push(eq(bookings.depotId, depotId));
    }

    const completedBookingsList = await db.select()
      .from(bookings)
      .where(and(...conditions));

    // 1. Avg Duration
    const timedBookings = completedBookingsList.filter(b => b.operationStartedAt && b.completedAt);
    const avgDuration = timedBookings.length > 0
      ? timedBookings.reduce((acc, b) => {
          const start = parseISO(b.operationStartedAt!);
          const end = parseISO(b.completedAt!);
          return acc + Math.abs(differenceInMinutes(end, start));
        }, 0) / timedBookings.length
      : 0;

    // 2. Reliability (On-time arrivals)
    const reliability = completedBookingsList.length > 0
      ? (completedBookingsList.filter(b => {
          if (!b.operationStartedAt) return false;
          const scheduled = b.time; // Format "HH:mm"
          const actual = parseISO(b.operationStartedAt);
          const [h, m] = scheduled.split(':').map(Number);
          const scheduledDate = new Date(actual);
          scheduledDate.setHours(h, m, 0, 0);
          const diff = differenceInMinutes(actual, scheduledDate);
          return diff >= -15 && diff <= 45;
        }).length / completedBookingsList.length) * 100
      : 100;

    // 3. Peak Hours
    const hourCounts: Record<string, number> = {};
    completedBookingsList.forEach(b => {
      const h = b.time.split(':')[0] + ':00';
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "-";

    // Usiamo sintassi SQLite per l'intervallo temporale
    let volumeConditions = [
      sql`date(date) >= date('now', '-7 days')`
    ];
    if (depotId) {
      volumeConditions.push(eq(bookings.depotId, depotId));
    }

    const volumeByDay = await db.select({
      date: bookings.date,
      count: sql<number>`count(*)`
    })
    .from(bookings)
    .where(and(...volumeConditions))
    .groupBy(bookings.date)
    .orderBy(asc(bookings.date));

    const recentBookings = await db.select()
      .from(bookings)
      .where(and(...volumeConditions));

    let palletsIn = 0;
    let palletsOut = 0;
    let opCarico = 0;
    let opScarico = 0;
    let opEntrambi = 0;

    recentBookings.forEach(b => {
      if (b.operationType === 'Scarico' || b.operationType === 'Reso') {
        palletsIn += (b.pallets || 0);
        opScarico++;
      } else if (b.operationType === 'Carico') {
        palletsOut += (b.pallets || 0);
        opCarico++;
      } else if (b.operationType === 'Entrambi') {
        palletsIn += (b.palletsScarico || 0);
        palletsOut += (b.palletsCarico || 0);
        opEntrambi++;
      }
    });

    // 5. SOS Count
    const sosCount = completedBookingsList.filter(b => b.isEmergency === true).length;

    return NextResponse.json({
      avgDuration: Math.round(avgDuration),
      reliability: Math.round(reliability),
      peakHour,
      volumeByDay,
      sosCount,
      palletsIn,
      palletsOut,
      opDistrib: { carico: opCarico, scarico: opScarico, entrambi: opEntrambi }
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
