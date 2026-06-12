import { NextResponse } from 'next/server';
import { db, users } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { id } = await props.params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'La motivazione è obbligatoria' }, { status: 400 });
    }

    const userResult = await db.select().from(users).where(and(eq(users.id, id), eq(users.status, 'PENDING'))).limit(1);
    const userReq = userResult[0];

    if (!userReq) {
      return NextResponse.json({ error: 'Richiesta non trovata o già processata' }, { status: 404 });
    }

    // Update the user
    const now = new Date().toISOString();
    await db.update(users)
      .set({
        status: 'REJECTED',
        reviewed_at: now,
        reviewed_by: session.id,
        rejection_reason: reason
      })
      .where(eq(users.id, id));

    // Log the rejection
    logAudit({
      userId: session.id,
      userEmail: session.email,
      userRole: session.role,
      action: 'UPDATE',
      entity: 'user',
      entityId: id,
      newValue: { status: 'REJECTED', reviewed_by: session.id, rejection_reason: reason },
      details: `Rifiutata richiesta di accesso per ${userReq.name}`
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error rejecting request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
