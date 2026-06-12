import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, sessions, users } from '@/db';
import { eq } from 'drizzle-orm';

// This is a minimal abstraction for retrieving current user from cookie in server-side Next.js
export async function getSession(options?: { bypassRedirect?: boolean }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) return null;

  let user: any = null;
  let mustChangePassword = false;

  try {
    const sessionResult = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    const session = sessionResult[0];
    if (!session || !session.userId) return null;

    const userResult = await db.select().from(users).where(eq(users.id, session.userId));
    const dbUser = userResult[0];
    if (!dbUser) return null;

    // Block non-active users
    if (dbUser.status && dbUser.status !== 'ACTIVE') return null;

    mustChangePassword = dbUser.must_change_password === true;
    const { password, ...safeUser } = dbUser;
    user = safeUser;
  } catch (err) {
    console.error('Auth error:', err);
    return null;
  }

  // redirect() MUST be called OUTSIDE try/catch — it works by throwing internally
  // Calling it inside a try/catch would cause it to be swallowed and return null
  if (mustChangePassword && !options?.bypassRedirect) {
    redirect('/change-password');
  }

  return user;
}

