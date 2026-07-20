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
        const { eq, and } = require('drizzle-orm');
        
        const bayResult = await db.select()
          .from(bays)
          .where(and(eq(bays.id, updates.bayId), eq(bays.depositId, booking.depotId)))
          .limit(1);
        
        const selectedBay = bayResult[0];
        if (!selectedBay) {
          return NextResponse.json({ error: 'La baia selezionata non è valida o non appartiene a questo deposito.' }, { status: 400 });
        }
        
        filteredUpdates.bayId = updates.bayId;
        filteredUpdates.bay = selectedBay.bayName; // Per retrocompatibilità con la stringa "bay"
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
