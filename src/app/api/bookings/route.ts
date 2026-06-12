import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseISO, subDays, setHours, setMinutes, isAfter } from 'date-fns';
import { getSession } from '@/lib/auth';
import { db, bookings } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const depotId = searchParams.get('depotId');
  
  let conditions = [];

  if (date) {
    conditions.push(eq(bookings.date, date));
  }

  if (user.role === 'admin' || user.role === 'gate') {
    const finalDepotId = user.depotId || depotId;
    if (finalDepotId) {
      conditions.push(eq(bookings.depotId, finalDepotId));
    }
    
    const results = await db.select()
      .from(bookings)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
      
    return NextResponse.json(results);
  } else {
    if (!depotId) {
      return NextResponse.json({ error: 'Specifica un deposito' }, { status: 400 });
    }
    conditions.push(eq(bookings.depotId, depotId));

    const results = await db.select()
      .from(bookings)
      .where(and(...conditions));

    const safeBookings = results.map((b: typeof bookings.$inferSelect) => {
      if (b.userId === user.id) {
        return b;
      }
      return { time: b.time, date: b.date, isBooked: true };
    });

    return NextResponse.json(safeBookings);
  }
}

import { BookingSchema } from '@/lib/schemas';

export async function POST(request: Request) {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    
    // Extract data for validation
    const rawData = {
      date: formData.get('date'),
      time: formData.get('time'),
      depotId: formData.get('depotId'),
      carrierName: formData.get('carrierName'),
      licensePlate: formData.get('licensePlate'),
      company: formData.get('company'),
      phone: formData.get('phone'),
      orderRef: formData.get('orderRef'),
      notes: formData.get('notes'),
      operationType: formData.get('operationType') || undefined,
      pallets: parseInt(formData.get('pallets') as string) || 0,
      difficulty: formData.get('difficulty') || undefined,
      isEmergency: formData.get('isEmergency') === 'true',
    };

    const validation = BookingSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dati non validi', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { 
      date, time, depotId, carrierName, licensePlate, 
      company, phone, orderRef, notes, operationType, 
      pallets, difficulty, isEmergency 
    } = validation.data;

    const file = formData.get('file') as File | null;

    // Skip checks for emergency bookings
    if (!isEmergency) {
      const targetDate = parseISO(date);
      const deadline = setMinutes(setHours(subDays(targetDate, 1), 15), 0);
      if (isAfter(new Date(), deadline)) {
        return NextResponse.json({ error: 'Tempo limite di prenotazione scaduto.' }, { status: 403 });
      }
      
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(bookings)
        .where(
          and(
            eq(bookings.date, date),
            eq(bookings.time, time),
            eq(bookings.depotId, depotId)
          )
        );
      
      const existingCount = countResult[0]?.count || 0;
      
      if (existingCount >= 10) {
        return NextResponse.json({ error: 'Capacità massima raggiunta per questo slot (10 mezzi).' }, { status: 409 });
      }
    }

    let attachmentUrl = null;
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const ext = path.extname(file.name);
      const uuidName = `${crypto.randomUUID()}${ext}`;
      const savePath = path.join(UPLOADS_DIR, uuidName);
      
      fs.writeFileSync(savePath, buffer);
      attachmentUrl = `/uploads/${uuidName}`;
    }
    
    const newBooking: typeof bookings.$inferInsert = {
      id: crypto.randomUUID(),
      userId: user.id,
      depotId,
      date,
      time,
      carrierName,
      licensePlate,
      company: company || '',
      phone: phone || '',
      orderRef: orderRef || null,
      notes: notes || '',
      status: 'pending',
      gateStatus: 'expected',
      operationType,         
      pallets,
      operationTypeScarico: formData.get('operationTypeScarico') as string || null,
      palletsScarico: parseInt(formData.get('palletsScarico') as string) || 0,
      operationTypeCarico: formData.get('operationTypeCarico') as string || null,
      palletsCarico: parseInt(formData.get('palletsCarico') as string) || 0,
      orderRefScarico: formData.get('orderRefScarico') as string || null,
      orderRefCarico: formData.get('orderRefCarico') as string || null,
      difficulty,
      isEmergency,
      attachment: attachmentUrl,
      createdAt: new Date().toISOString()
    };
    
    await db.insert(bookings).values(newBooking);
    
    // Audit Log
    const headersList = await headers();
    logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      entity: 'booking',
      entityId: newBooking.id,
      newValue: newBooking,
      ipAddress: headersList.get('x-forwarded-for') || '127.0.0.1',
      userAgent: headersList.get('user-agent'),
      details: `Nuova prenotazione creata per deposito ${depotId}`
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Error saving booking:', error);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

