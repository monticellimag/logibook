import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/sqlite';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const userStmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND password = ?');
    const user = userStmt.get(email, password) as any;

    if (!user) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    const sessionId = crypto.randomUUID();
    const insertSession = db.prepare('INSERT INTO sessions (id, userId, createdAt) VALUES (?, ?, ?)');
    insertSession.run(sessionId, user.id, new Date().toISOString());

    (await cookies()).set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return NextResponse.json({ success: true, role: user.role }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
