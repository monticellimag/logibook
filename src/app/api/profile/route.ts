import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/sqlite';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = db.prepare('SELECT id, email, name, vatNumber, address, city, zipCode, phone, contactPerson FROM users WHERE id = ?').get(user.id);
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const updates = await request.json();
    const fields = ['name', 'vatNumber', 'address', 'city', 'zipCode', 'phone', 'contactPerson'];
    
    const setClauses: string[] = [];
    const params: any = { id: user.id };

    fields.forEach(field => {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = @${field}`);
        params[field] = updates[field];
      }
    });

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = @id`;
    db.prepare(query).run(params);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Errore durante l\'aggiornamento del profilo' }, { status: 500 });
  }
}
