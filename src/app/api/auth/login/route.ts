import { NextResponse } from 'next/server';
import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { db, users, sessions } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { logAudit } from '@/lib/audit';
import { LoginSchema } from '@/lib/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = LoginSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dati non validi', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { email, password } = validation.data;

    const userResult = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    // Verifica password (supporta hash bcrypt $2a$ e $2b$)
    const isBcrypt = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
    const isMatch = isBcrypt 
      ? bcrypt.compareSync(password, user.password)
      : password === user.password;

    if (!isMatch) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    if (user.status && user.status !== 'ACTIVE') {
      return NextResponse.json({ error: `Account non attivo (Stato: ${user.status})` }, { status: 403 });
    }

    // Verifica scadenza password temporanea (24 ore)
    if (user.must_change_password && user.temp_password_at) {
      const createdAt = new Date(user.temp_password_at).getTime();
      const now = new Date().getTime();
      const diffHours = (now - createdAt) / (1000 * 60 * 60);
      
      if (diffHours > 24) {
        return NextResponse.json({ 
          error: 'La password temporanea è scaduta (validità 24h). Contatta l\'amministratore per un nuovo reset.' 
        }, { status: 403 });
      }
    }

    const sessionId = crypto.randomUUID();
    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      createdAt: new Date().toISOString()
    });

    (await cookies()).set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    // Mapping del ruolo per l'audit log
    let auditRole = user.role;
    if (user.role === 'user') auditRole = 'vettore';
    if (user.role === 'gate') auditRole = 'hub';

    // Audit Log
    const headersList = await headers();
    logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: auditRole,
      action: 'LOGIN',
      entity: 'auth',
      entityId: sessionId,
      ipAddress: headersList.get('x-forwarded-for') || '127.0.0.1',
      userAgent: headersList.get('user-agent'),
      details: 'Accesso effettuato con successo'
    });

    return NextResponse.json({ 
      success: true, 
      role: user.role, 
      mustChangePassword: !!user.must_change_password 
    }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

