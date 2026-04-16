import { cookies } from 'next/headers';
import db from './sqlite';

// This is a minimal abstraction for retrieving current user from cookie in server-side Next.js
export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (!sessionId) return null;

  try {
    const sessionStmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
    const session = sessionStmt.get(sessionId) as any;
    
    if (!session) return null;

    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = userStmt.get(session.userId) as any;
    
    if (!user) return null;
    
    const { password, ...safeUser } = user;
    return safeUser;
  } catch (err) {
    return null;
  }
}
