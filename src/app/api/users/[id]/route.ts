import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';
import * as bcrypt from 'bcryptjs';

// PATCH: Aggiorna utente (solo admin)
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { id } = await props.params;
    const body = await request.json();
    const { name, email, role, depotId, password } = body;

    // Recupera utente attuale
    const userResult = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const user = userResult[0];
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Se viene fornita una password, la hashiamo e attiviamo il reset obbligatorio
    let hashedPassword = user.password;
    let mustChange = user.must_change_password || false;
    let tempAt = user.temp_password_at;

    if (password && password.trim() !== "") {
      const salt = bcrypt.genSaltSync(10);
      hashedPassword = bcrypt.hashSync(password, salt);
      mustChange = true;
      tempAt = new Date().toISOString();
    }

    await db.update(users)
      .set({
        name: name || user.name,
        email: email || user.email,
        role: role || user.role,
        depotId: depotId || user.depotId,
        password: hashedPassword,
        must_change_password: mustChange,
        temp_password_at: tempAt
      })
      .where(eq(users.id, id));

    // Audit Log
    logAudit({
      userId: session.id,
      userEmail: session.email,
      userRole: session.role,
      action: 'UPDATE',
      entity: 'user',
      entityId: id,
      newValue: { name, email, role, depotId, passwordProvided: !!password },
      details: `Aggiornato utente ${user.name} (${id})`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// GET: Dettagli utente singolo (solo admin)
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { id } = await props.params;
    const userResult = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      depotId: users.depotId,
      vatNumber: users.vatNumber,
      phone: users.phone,
      contactPerson: users.contactPerson,
      status: users.status,
      requested_at: users.requested_at
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
