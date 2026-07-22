import { NextResponse } from 'next/server';
import { db, bays, bookings } from '@/db';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';
import { z } from 'zod';
import crypto from 'crypto';

const createBaySchema = z.object({
  depositId: z.string().min(1, 'Il deposito è obbligatorio'),
  bayNumber: z.number().int().positive('Il numero baia deve essere positivo'),
  bayName: z.string().min(1, 'Il nome della baia è obbligatorio'),
  status: z.enum(['available', 'maintenance']).optional().default('available'),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'gate')) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json({ error: 'depositId è obbligatorio' }, { status: 400 });
    }

    const result = await db.select()
      .from(bays)
      .where(eq(bays.depositId, depositId))
      .orderBy(asc(bays.bayNumber));

    // Calculate live status: check if there are bookings with gateStatus in arrived/loading/unloading
    const activeBookings = await db.select({ bayId: bookings.bayId })
      .from(bookings)
      .where(and(eq(bookings.depotId, depositId), inArray(bookings.gateStatus, ['arrived', 'loading', 'unloading'])));

    const occupiedBayIds = new Set(activeBookings.map(b => b.bayId).filter(Boolean));

    // Calculate queued count per bay
    const queuedBookings = await db.select({ bayId: bookings.bayId })
      .from(bookings)
      .where(and(eq(bookings.depotId, depositId), eq(bookings.gateStatus, 'expected')));

    const queueCounts: Record<string, number> = {};
    queuedBookings.forEach(b => {
      if (b.bayId) {
        queueCounts[b.bayId] = (queueCounts[b.bayId] || 0) + 1;
      }
    });

    const resultWithStatus = result.map(b => ({
      ...b,
      isOccupied: occupiedBayIds.has(b.id),
      queuedCount: queueCounts[b.id] || 0,
    }));

    return NextResponse.json(resultWithStatus, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });


  } catch (error) {
    console.error('Error fetching bays:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = createBaySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { depositId, bayNumber, bayName, status } = parseResult.data;

    // Check duplicate bayNumber in same deposit
    const existing = await db.select()
      .from(bays)
      .where(and(eq(bays.depositId, depositId), eq(bays.bayNumber, bayNumber)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: `La baia numero ${bayNumber} esiste già in questo deposito` }, { status: 400 });
    }

    const newBayId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newBay = {
      id: newBayId,
      depositId,
      bayNumber,
      bayName,
      status,
      createdAt: now,
    };

    await db.insert(bays).values(newBay);

    // Audit Log
    const headersList = await headers();
    logAudit({
      userId: session.id,
      userEmail: session.email,
      userRole: session.role,
      action: 'CREATE',
      entity: 'bay',
      entityId: newBayId,
      oldValue: null,
      newValue: newBay,
      ipAddress: headersList.get('x-forwarded-for') || '127.0.0.1',
      userAgent: headersList.get('user-agent'),
      details: `Creata nuova baia ${bayName} (N. ${bayNumber})`
    });

    return NextResponse.json(newBay, { status: 201 });
  } catch (error) {
    console.error('Error creating bay:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
