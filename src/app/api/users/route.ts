import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, users, bookings, sessions } from '@/db';
import { eq, or, isNull, desc } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';
import { DeleteUserSchema } from '@/lib/schemas';

// GET: Lista utenti (solo admin)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const result = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    depotId: users.depotId,
    createdAt: users.createdAt
  })
  .from(users)
  .where(or(eq(users.status, 'ACTIVE'), isNull(users.status)))
  .orderBy(desc(users.createdAt));

  return NextResponse.json(result);
}

// DELETE: Elimina utente (solo admin)
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const validation = DeleteUserSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dati non validi', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { id } = validation.data;

    // Non può cancellare se stesso
    if (id === session.id) {
      return NextResponse.json({ error: 'Non puoi eliminare il tuo stesso account' }, { status: 400 });
    }

    // Gestione vincoli: scolleghiamo le prenotazioni invece di cancellarle (per mantenere lo storico)
    await db.update(bookings).set({ userId: null }).where(eq(bookings.userId, id));
    
    // Cancelliamo le sessioni attive
    await db.delete(sessions).where(eq(sessions.userId, id));
    
    // Ora possiamo cancellare l'utente
    await db.delete(users).where(eq(users.id, id));

    // Audit Log
    const headersList = await headers();
    logAudit({
      userId: session.id,
      userEmail: session.email,
      userRole: session.role,
      action: 'DELETE',
      entity: 'user',
      entityId: id,
      ipAddress: headersList.get('x-forwarded-for') || '127.0.0.1',
      userAgent: headersList.get('user-agent'),
      details: `Eliminato utente ${id}`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Errore interno', details: error.message }, { status: 500 });
  }
}
