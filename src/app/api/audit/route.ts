import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, audit_logs } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * GET: Restituisce i log di audit con filtri.
 * Accessibile solo agli amministratori.
 */
export async function GET(request: Request) {
  const session = await getSession();
  
  // Controllo sicurezza: solo admin
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');
  const date = searchParams.get('date'); // Formato YYYY-MM-DD
  const entity = searchParams.get('entity');

  let conditions = [];

  if (action) {
    conditions.push(eq(audit_logs.action, action as any));
  }

  if (userId) {
    conditions.push(eq(audit_logs.userId, userId));
  }

  if (entity) {
    conditions.push(eq(audit_logs.entity, entity as any));
  }

  if (date) {
    // In PostgreSQL filtriamo la data trasformando il timestamp in date
    conditions.push(sql`DATE(${audit_logs.timestamp}) = ${date}`);
  }

  try {
    const logs = await db.select()
      .from(audit_logs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(audit_logs.timestamp))
      .limit(500);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Audit API Error:', error);
    return NextResponse.json({ error: 'Errore nel recupero dei log' }, { status: 500 });
  }
}
