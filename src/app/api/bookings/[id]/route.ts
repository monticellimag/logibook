import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, bookings, bays } from '@/db';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const bookingResult = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    const booking = bookingResult[0];

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    if (user.depotId && booking.depotId !== user.depotId) {
      return NextResponse.json({ error: 'Non hai i permessi per cancellare prenotazioni di altri depositi.' }, { status: 403 });
    }

    await db.delete(bookings).where(eq(bookings.id, id));

    // Audit Log
    const headersList = await headers();
    logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DELETE',
      entity: 'booking',
      entityId: id,
      oldValue: booking,
      ipAddress: headersList.get('x-forwarded-for') || '127.0.0.1',
      userAgent: headersList.get('user-agent'),
      details: `Eliminata prenotazione ${id}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete booking error:', error);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || (user.role !== 'admin' && user.role !== 'gate')) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const updates = await request.json();
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });

    const bookingResult = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    const booking = bookingResult[0];

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    if (user.depotId && booking.depotId !== user.depotId) {
      return NextResponse.json({ error: 'Non hai i permessi per modificare questa prenotazione.' }, { status: 403 });
    }

    const filteredUpdates: any = {};
    if (updates.status !== undefined) filteredUpdates.status = updates.status;
    if (updates.difficulty !== undefined) filteredUpdates.difficulty = updates.difficulty;
    if (updates.isEmergency !== undefined) {
      filteredUpdates.isEmergency = Boolean(updates.isEmergency && updates.isEmergency !== 0 && updates.isEmergency !== '0' && updates.isEmergency !== 'false');
    }
    
    if (updates.gateStatus !== undefined) {
      filteredUpdates.gateStatus = updates.gateStatus;
      if (updates.gateStatus === 'arrived') {
        filteredUpdates.operationStartedAt = new Date().toISOString();
      } else if (updates.gateStatus === 'completed') {
        filteredUpdates.completedAt = new Date().toISOString();
      }
    }

    if (updates.bay !== undefined) filteredUpdates.bay = updates.bay;
    if (updates.bayId !== undefined) {
      if (updates.bayId === null) {
        filteredUpdates.bayId = null;
        filteredUpdates.bay = null;
      } else {
        const { eq, and, inArray } = require('drizzle-orm');
        
        const bayResult = await db.select()
          .from(bays)
          .where(and(eq(bays.id, updates.bayId), eq(bays.depositId, booking.depotId)))
          .limit(1);
        
        const selectedBay = bayResult[0];
        if (!selectedBay) {
          return NextResponse.json({ error: 'La baia selezionata non è valida o non appartiene a questo deposito.' }, { status: 400 });
        }
        
        filteredUpdates.bayId = updates.bayId;
        filteredUpdates.bay = selectedBay.bayName;

        // Check if there is already an active truck in this bay today
        if (updates.gateStatus === 'arrived' || booking.gateStatus === 'expected') {
          const activeInBay = await db.select()
            .from(bookings)
            .where(
              and(
                eq(bookings.depotId, booking.depotId),
                eq(bookings.bayId, updates.bayId),
                eq(bookings.date, booking.date),
                inArray(bookings.gateStatus, ['arrived', 'loading', 'unloading'])
              )
            )
            .limit(1);

          // If bay is currently occupied by another vehicle, keep this booking as queued ('expected')
          if (activeInBay.length > 0 && activeInBay[0].id !== id) {
            filteredUpdates.gateStatus = 'expected';
            delete filteredUpdates.operationStartedAt;
          }
        }
      }
    }

    // Auto-promotion: when a booking completes, automatically promote the next queued vehicle for this bay (priority first!)
    const isCompleting = (updates.gateStatus === 'completed') || (filteredUpdates.gateStatus === 'completed');
    const targetBayId = filteredUpdates.bayId || booking.bayId;

    if (isCompleting && targetBayId) {
      const { and, eq, desc, asc } = require('drizzle-orm');
      const nextInQueue = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.depotId, booking.depotId),
            eq(bookings.bayId, targetBayId),
            eq(bookings.date, booking.date),
            eq(bookings.gateStatus, 'expected')
          )
        )
        .orderBy(desc(bookings.isEmergency), asc(bookings.operationStartedAt), asc(bookings.createdAt), asc(bookings.time))
        .limit(1);

      if (nextInQueue.length > 0) {
        const nextBooking = nextInQueue[0];
        await db
          .update(bookings)
          .set({
            gateStatus: 'arrived',
            operationStartedAt: new Date().toISOString(),
          })
          .where(eq(bookings.id, nextBooking.id));
      }
    }
    if (updates.arrivalPhoto !== undefined) filteredUpdates.arrivalPhoto = updates.arrivalPhoto;


    if (Object.keys(filteredUpdates).length > 0) {
      await db.update(bookings)
        .set(filteredUpdates)
        .where(eq(bookings.id, id));

      // Audit Log
      const headersList = await headers();
      logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'UPDATE',
        entity: 'booking',
        entityId: id,
        oldValue: booking,
        newValue: { ...booking, ...filteredUpdates },
        ipAddress: headersList.get('x-forwarded-for') || '127.0.0.1',
        userAgent: headersList.get('user-agent'),
        details: `Aggiornata prenotazione ${id}`
      });
    }

    return NextResponse.json({ ...booking, ...filteredUpdates });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
