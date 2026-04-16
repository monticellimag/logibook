import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/sqlite';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only Admin or Gate can view other profiles
  if (user.role !== 'admin' && user.role !== 'gate' && user.id !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const targetUser = db.prepare('SELECT id, email, name, role, depotId, vatNumber, address, city, zipCode, phone, contactPerson FROM users WHERE id = ?').get(params.id);
  
  if (!targetUser) {
    return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
  }

  return NextResponse.json(targetUser);
}
