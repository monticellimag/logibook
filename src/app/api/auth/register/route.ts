import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/sqlite';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';

// POST: Registra un nuovo utente (vettore self-register, o admin che crea utente)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, depotId } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Compila tutti i campi' }, { status: 400 });
    }

    // Solo un admin autenticato può creare utenti con ruoli diversi da 'user'
    const requestedRole = role || 'user';
    if (requestedRole !== 'user') {
      const session = await getSession();
      if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Non autorizzato a creare utenti con questo ruolo' }, { status: 403 });
      }
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'Email già registrata' }, { status: 409 });
    }

    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role: requestedRole,
      depotId: depotId || null,
      createdAt: new Date().toISOString()
    };

    db.prepare('INSERT INTO users (id, email, password, name, role, depotId, createdAt) VALUES (@id, @email, @password, @name, @role, @depotId, @createdAt)').run(newUser);

    // Auto login solo se auto-registrazione vettore
    if (requestedRole === 'user') {
      const sessionId = crypto.randomUUID();
      db.prepare('INSERT INTO sessions (id, userId, createdAt) VALUES (?, ?, ?)').run(sessionId, newUser.id, new Date().toISOString());
      (await cookies()).set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      return NextResponse.json({ success: true, role: newUser.role }, { status: 201 });
    }

    return NextResponse.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, depotId: newUser.depotId } }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
