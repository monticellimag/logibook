import { NextResponse } from 'next/server';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordSchema } from '@/lib/schemas';

export async function POST(request: Request) {
  try {
    // We must bypass redirect here, otherwise the API call itself gets redirected!
    const session = await getSession({ bypassRedirect: true });
    
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    if (!session.must_change_password) {
      return NextResponse.json({ error: 'Cambio password non richiesto' }, { status: 400 });
    }

    const body = await request.json();
    const validation = ChangePasswordSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dati non validi', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { currentPassword, newPassword } = validation.data;

    // Fetch full user record from DB to get the current hash
    const userResult = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Se l'utente deve cambiare la password (primo accesso), non obblighiamo a reinserire quella temporanea
    // che ha già usato per loggarsi pochi secondi prima.
    if (!session.must_change_password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Password attuale mancante' }, { status: 400 });
      }
      
      // Verifica password attuale (supporta hash bcrypt $2a$ e $2b$)
      const isBcrypt = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
      const isMatch = isBcrypt 
        ? bcrypt.compareSync(currentPassword, user.password)
        : currentPassword === user.password;

      if (!isMatch) {
        return NextResponse.json({ error: 'La password attuale è errata' }, { status: 401 });
      }
    }

    // Hash the new password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    // Update DB
    await db.update(users)
      .set({ 
        password: hashedPassword, 
        must_change_password: false 
      })
      .where(eq(users.id, session.id));

    // Audit Log
    logAudit({
      userId: session.id,
      userEmail: session.email,
      userRole: session.role,
      action: 'UPDATE',
      entity: 'auth',
      entityId: session.id,
      newValue: { must_change_password: 0 },
      details: 'Password cambiata al primo accesso'
    });

    return NextResponse.json({ success: true, role: session.role });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
