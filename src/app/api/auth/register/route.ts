import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { RegisterSchema } from '@/lib/schemas';

// POST: Registra un nuovo utente (vettore self-register, o admin che crea utente)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = RegisterSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dati non validi', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { name, email, password, role, depotId, vatNumber, contactPerson, phone, notes } = validation.data;

    // Solo un admin autenticato può creare utenti con ruoli diversi da 'user'
    const requestedRole = role || 'user';
    if (requestedRole !== 'user') {
      const session = await getSession();
      if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Non autorizzato a creare utenti con questo ruolo' }, { status: 403 });
      }
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email già registrata' }, { status: 409 });
    }

    const isSelfRegistration = requestedRole === 'user';
    const status = isSelfRegistration ? 'PENDING' : 'ACTIVE';
    const finalPassword = isSelfRegistration ? null : password;

    const newUserId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await db.insert(users).values({
      id: newUserId,
      name,
      email,
      password: finalPassword || '',
      role: requestedRole,
      depotId: depotId || null,
      vatNumber: vatNumber || null,
      contactPerson: contactPerson || null,
      phone: phone || null,
      notes: notes || null,
      status: status,
      requested_at: createdAt,
      createdAt: createdAt
    });

    // Audit Log
    const headersList = await headers();
    logAudit({
      userId: newUserId,
      userEmail: email,
      userRole: requestedRole,
      action: 'CREATE',
      entity: 'user',
      entityId: newUserId,
      newValue: { id: newUserId, email: email, role: requestedRole, name: name },
      ipAddress: headersList.get('x-forwarded-for') || '127.0.0.1',
      userAgent: headersList.get('user-agent'),
      details: `Nuovo utente creato (${requestedRole})`
    });

    // Auto login rimosso: le richieste devono essere approvate dall'admin
    if (requestedRole === 'user') {
      return NextResponse.json({ success: true, pending: true }, { status: 201 });
    }

    return NextResponse.json({ 
      success: true, 
      user: { id: newUserId, name: name, email: email, role: requestedRole, depotId: depotId } 
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
