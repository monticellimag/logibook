import { NextResponse } from 'next/server';
import { db, sessions } from '@/db';
import { eq } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  const user = await getSession();
  if (user && sessionId) {
    const headersList = await headers();
    logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGOUT',
      entity: 'auth',
      entityId: sessionId,
      ipAddress: headersList.get('x-forwarded-for') || '127.0.0.1',
      userAgent: headersList.get('user-agent'),
      details: 'Logout effettuato'
    });

    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  cookieStore.delete('session_id');

  return NextResponse.json({ success: true });
}
