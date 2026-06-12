import { NextResponse } from 'next/server';
import { db, users } from '@/db';
import { eq, and, asc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const requests = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      vatNumber: users.vatNumber,
      contactPerson: users.contactPerson,
      phone: users.phone,
      interestedDepots: users.interested_depots,
      notes: users.notes,
      requestedAt: users.requested_at,
      status: users.status
    })
    .from(users)
    .where(and(eq(users.status, 'PENDING'), eq(users.role, 'user')))
    .orderBy(asc(users.requested_at));

    return NextResponse.json(requests, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
