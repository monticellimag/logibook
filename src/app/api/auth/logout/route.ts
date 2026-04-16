import { NextResponse } from 'next/server';
import db from '@/lib/sqlite';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  if (sessionId) {
    const deleteSession = db.prepare('DELETE FROM sessions WHERE id = ?');
    deleteSession.run(sessionId);
  }

  cookieStore.delete('session_id');

  return NextResponse.json({ success: true });
}
