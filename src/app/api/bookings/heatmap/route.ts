import { NextResponse } from 'next/server';
import { db, bookings } from '@/db';
import { eq, and, sql, between } from 'drizzle-orm';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthStr = searchParams.get('month'); // Expects "yyyy-MM"
  const depotId = searchParams.get('depotId');

  try {
    const today = new Date();
    const targetDate = monthStr ? new Date(monthStr + "-01") : today;
    const start = format(startOfMonth(targetDate), "yyyy-MM-dd");
    const end = format(endOfMonth(targetDate), "yyyy-MM-dd");

    let conditions = [between(bookings.date, start, end)];
    
    if (depotId) {
      conditions.push(eq(bookings.depotId, depotId));
    }

    const stats = await db.select({
      date: bookings.date,
      count: sql<number>`count(*)`
    })
    .from(bookings)
    .where(and(...conditions))
    .groupBy(bookings.date);

    // Transform to map { "2026-04-15": 10 }
    const heatmap = stats.reduce((acc, curr) => {
      acc[curr.date] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json(heatmap);
  } catch (err) {
    console.error("Heatmap error:", err);
    return NextResponse.json({ error: "Failed to fetch heatmap data" }, { status: 500 });
  }
}
