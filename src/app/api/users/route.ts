import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/sqlite';

// GET: Lista utenti (solo admin)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const users = db.prepare('SELECT id, name, email, role, depotId, createdAt FROM users ORDER BY createdAt DESC').all();
  return NextResponse.json(users);
}

// DELETE: Elimina utente (solo admin)
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

  // Non può cancellare se stesso
  if (id === session.id) {
    return NextResponse.json({ error: 'Non puoi eliminare il tuo stesso account' }, { status: 400 });
  }

  db.prepare('DELETE FROM sessions WHERE userId = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
