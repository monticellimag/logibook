import { NextResponse } from 'next/server';
import { db, bays } from '@/db';
import { eq, and, ne } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';
import { z } from 'zod';

const updateBaySchema = z.object({
  bayNumber: z.number().int().positive('Il numero baia deve essere positivo').optional(),
  bayName: z.string().min(1, 'Il nome della baia è obbligatorio').optional(),
  status: z.enum(['available', 'maintenance']).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parseResult = updateBaySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const existingBayResult = await db.select().from(bays).where(eq(bays.id, id)).limit(1);
    const existingBay = existingBayResult[0];

    if (!existingBay) {
      return NextResponse.json({ error: 'Baia non trovata' }, { status: 404 });
    }

    const updates = parseResult.data;

    // Check duplicate bayNumber in same deposit (if changing bayNumber)
    if (updates.bayNumber !== undefined && updates.bayNumber !== existingBay.bayNumber) {
      const duplicate = await db.select()
        .from(bays)
        .where(
          and(
            eq(bays.depositId, existingBay.depositId),
            eq(bays.bayNumber, updates.bayNumber),
            ne(bays.id, id)
          )
        )
        .limit(1);

      if (duplicate.length > 0) {
        return NextResponse.json({ error: `La baia numero ${updates.bayNumber} esiste già in questo deposito` }, { status: 400 });
      }
    }

    const updatedBay = { ...existingBay, ...updates };

    await db.update(bays)
      .set(updates)
      .where(eq(bays.id, id));

    // Audit Log
    const headersList = await headers();
    logAudit({
      userId: session.id,
      userEmail: session.email,
      userRole: session.role,
      action: 'UPDATE',
      entity: 'bay',
      entityId: id,
      oldValue: existingBay,
      newValue: updatedBay,
      ipAddress: headersList.get('x-forwarded-for') || '127.0.0.1',
      userAgent: headersList.get('user-agent'),
      details: `Aggiornata baia ${id}`
    });

    return NextResponse.json(updatedBay, { status: 200 });
  } catch (error) {
    console.error('Error updating bay:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { id } = await context.params;

    const existingBayResult = await db.select().from(bays).where(eq(bays.id, id)).limit(1);
    const existingBay = existingBayResult[0];

    if (!existingBay) {
      return NextResponse.json({ error: 'Baia non trovata' }, { status: 404 });
    }

    await db.delete(bays).where(eq(bays.id, id));

    // Audit Log
    const headersList = await headers();
    logAudit({
      userId: session.id,
      userEmail: session.email,
      userRole: session.role,
      action: 'DELETE',
      entity: 'bay',
      entityId: id,
      oldValue: existingBay,
      newValue: null,
      ipAddress: headersList.get('x-forwarded-for') || '127.0.0.1',
      userAgent: headersList.get('user-agent'),
      details: `Eliminata baia ${existingBay.bayName} (N. ${existingBay.bayNumber})`
    });

    return NextResponse.json({ message: 'Baia eliminata con successo' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting bay:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
