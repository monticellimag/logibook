import { NextResponse } from 'next/server';
import { db, bookings, users } from '@/db';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const depotId = searchParams.get('depotId');
  const month = searchParams.get('month'); // Format: "YYYY-MM"

  if (!depotId || !month) {
    return NextResponse.json({ error: "depotId and month are required" }, { status: 400 });
  }

  try {
    // We want all bookings for the specified month
    // PostgreSQL string matching: date starts with "YYYY-MM"
    const exportData = await db.select({
      id: bookings.id,
      date: bookings.date,
      time: bookings.time,
      carrierName: bookings.carrierName,
      company: bookings.company,
      licensePlate: bookings.licensePlate,
      operationType: bookings.operationType,
      pallets: bookings.pallets,
      palletsCarico: bookings.palletsCarico,
      palletsScarico: bookings.palletsScarico,
      status: bookings.status,
      gateStatus: bookings.gateStatus,
      isEmergency: bookings.isEmergency,
      bay: bookings.bay,
      operationStartedAt: bookings.operationStartedAt,
      completedAt: bookings.completedAt,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.depotId, depotId),
        sql`date LIKE ${month + '-%'}`
      )
    )
    .orderBy(bookings.date, bookings.time);

    // Convert to CSV
    const headers = [
      "Data", "Ora Prevista", "Vettore", "Azienda", "Targa", 
      "Tipo Operazione", "Bancali Tot", "Bancali Carico", "Bancali Scarico",
      "Stato", "Gate", "Urgenza SOS", "Baia Assegnata", 
      "Inizio Operazione", "Fine Operazione"
    ];

    const csvRows = [];
    csvRows.push(headers.join(';')); // Italian Excel uses ;

    exportData.forEach(row => {
      const isSos = row.isEmergency ? "SI" : "NO";
      
      const values = [
        row.date,
        row.time,
        `"${(row.carrierName || '').replace(/"/g, '""')}"`,
        `"${(row.company || '').replace(/"/g, '""')}"`,
        row.licensePlate || '',
        row.operationType || '',
        row.pallets || 0,
        row.palletsCarico || 0,
        row.palletsScarico || 0,
        row.status || '',
        row.gateStatus || '',
        isSos,
        row.bay || '',
        row.operationStartedAt ? new Date(row.operationStartedAt).toLocaleTimeString('it-IT') : '',
        row.completedAt ? new Date(row.completedAt).toLocaleTimeString('it-IT') : ''
      ];
      csvRows.push(values.join(';'));
    });

    const csvString = csvRows.join('\n');

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="report_${month}_depot_${depotId}.csv"`,
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 });
  }
}
