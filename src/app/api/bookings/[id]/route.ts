import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/sqlite';

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
    const fetchStmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    const booking = fetchStmt.get(id) as any;

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    if (user.depotId && booking.depotId !== user.depotId) {
      return NextResponse.json({ error: 'Non hai i permessi per cancellare prenotazioni di altri depositi.' }, { status: 403 });
    }

    const deleteStmt = db.prepare('DELETE FROM bookings WHERE id = ?');
    deleteStmt.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
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

    const fetchStmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    const booking = fetchStmt.get(id) as any;

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    if (user.depotId && booking.depotId !== user.depotId) {
      return NextResponse.json({ error: 'Non hai i permessi per modificare questa prenotazione.' }, { status: 403 });
    }

    const setClauses: string[] = [];
    const updateParams: any = { id };

    if (updates.status !== undefined) {
      setClauses.push('status = @status');
      updateParams.status = updates.status;
    }
    
    if (updates.difficulty !== undefined) {
      setClauses.push('difficulty = @difficulty');
      updateParams.difficulty = updates.difficulty;
    }

    if (updates.gateStatus !== undefined) {
      setClauses.push('gateStatus = @gateStatus');
      updateParams.gateStatus = updates.gateStatus;
      
      if (updates.gateStatus === 'arrived') {
        setClauses.push('operationStartedAt = @operationStartedAt');
        updateParams.operationStartedAt = new Date().toISOString();
      } else if (updates.gateStatus === 'completed') {
        setClauses.push('completedAt = @completedAt');
        updateParams.completedAt = new Date().toISOString();
      }
    }

    if (updates.arrivalPhoto !== undefined) {
      setClauses.push('arrivalPhoto = @arrivalPhoto');
      updateParams.arrivalPhoto = updates.arrivalPhoto;
    }

    if (setClauses.length > 0) {
      const updateStmt = db.prepare(`UPDATE bookings SET ${setClauses.join(', ')} WHERE id = @id`);
      updateStmt.run(updateParams);
    }

    return NextResponse.json({ ...booking, ...updateParams });
  } catch (error) {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
