import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    vatNumber: users.vatNumber,
    address: users.address,
    city: users.city,
    zipCode: users.zipCode,
    phone: users.phone,
    contactPerson: users.contactPerson
  })
  .from(users)
  .where(eq(users.id, user.id))
  .limit(1);

  return NextResponse.json(profile[0]);
}

export async function PATCH(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const updates = await request.json();
    const allowedFields = ['name', 'email', 'vatNumber', 'address', 'city', 'zipCode', 'phone', 'contactPerson'];
    
    const filteredUpdates: any = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    // Recupera i dati attuali per l'audit log prima dell'aggiornamento
    const currentProfileResult = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const currentProfile = currentProfileResult[0];
    
    if (!currentProfile) {
      return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });
    }

    await db.update(users)
      .set(filteredUpdates)
      .where(eq(users.id, user.id));

    // Audit Log
    const headersList = await headers();
    logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      entity: 'user',
      entityId: user.id,
      oldValue: currentProfile,
      newValue: { ...currentProfile, ...filteredUpdates },
      ipAddress: headersList.get('x-forwarded-for') || '127.0.0.1',
      userAgent: headersList.get('user-agent'),
      details: 'Profilo aggiornato'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Errore durante l\'aggiornamento del profilo' }, { status: 500 });
  }
}
