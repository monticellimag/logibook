import { NextResponse } from 'next/server';
import db from '@/lib/sqlite';
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

    let query = `
      SELECT date, COUNT(*) as count 
      FROM bookings 
      WHERE date BETWEEN ? AND ?
    `;
    let params: any[] = [start, end];

    if (depotId) {
      query += " AND depotId = ?";
      params.push(depotId);
    }

    query += " GROUP BY date";

    const stats = db.prepare(query).all(params) as { date: string, count: number }[];

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
