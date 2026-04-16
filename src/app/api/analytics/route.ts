import { NextResponse } from 'next/server';
import db from '@/lib/sqlite';
import { differenceInMinutes, parseISO } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const depotId = searchParams.get('depotId');

  try {
    let query = "SELECT * FROM bookings WHERE status = 'completed'";
    let params = [];
    if (depotId) {
      query += " AND depotId = ?";
      params.push(depotId);
    }
    const bookings = db.prepare(query).all(params) as any[];

    // 1. Avg Duration
    const completedBookings = bookings.filter(b => b.operationStartedAt && b.completedAt);
    const avgDuration = completedBookings.length > 0
      ? completedBookings.reduce((acc, b) => {
          const start = parseISO(b.operationStartedAt);
          const end = parseISO(b.completedAt);
          return acc + Math.abs(differenceInMinutes(end, start));
        }, 0) / completedBookings.length
      : 0;

    // 2. Reliability (On-time arrivals)
    // We consider it "on time" if arrived within [-15, +45] mins of scheduled 'time'
    const reliability = bookings.length > 0
      ? (bookings.filter(b => {
          if (!b.operationStartedAt) return false;
          const scheduled = b.time; // Format "HH:mm"
          const actual = parseISO(b.operationStartedAt);
          const [h, m] = scheduled.split(':').map(Number);
          const scheduledDate = new Date(actual);
          scheduledDate.setHours(h, m, 0, 0);
          const diff = differenceInMinutes(actual, scheduledDate);
          return diff >= -15 && diff <= 45;
        }).length / bookings.length) * 100
      : 100;

    // 3. Peak Hours
    const hourCounts: Record<string, number> = {};
    bookings.forEach(b => {
      const h = b.time.split(':')[0] + ':00';
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "-";

    // 4. Volume by day (last 7 days)
    const volumeByDay = db.prepare(`
      SELECT date, COUNT(*) as count 
      FROM bookings 
      WHERE date >= date('now', '-7 days')
      ${depotId ? "AND depotId = ?" : ""}
      GROUP BY date 
      ORDER BY date ASC
    `).all(depotId ? [depotId] : []) as any[];

    // 5. SOS Count
    const sosCount = bookings.filter(b => b.isEmergency === 1).length;

    return NextResponse.json({
      avgDuration: Math.round(avgDuration),
      reliability: Math.round(reliability),
      peakHour,
      volumeByDay,
      sosCount
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
