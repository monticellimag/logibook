import { NextResponse } from 'next/server';
import { db, users } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import * as bcrypt from 'bcryptjs';

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const num = '0123456789';
  const sym = '!@#$%^&*()_+~|}{[]:;?><,./-=';
  const allChars = upper + lower + num + sym;
  
  let password = '';
  // Ensure at least one of each required type
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += num[Math.floor(Math.random() * num.length)];
  password += sym[Math.floor(Math.random() * sym.length)];
  
  // Fill the rest up to 12 chars
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the string
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { id } = await props.params;
    console.log('[API Approve] Processing ID:', id);

    const userResult = await db.select().from(users).where(and(eq(users.id, id), eq(users.status, 'PENDING'))).limit(1);
    const userReq = userResult[0];

    if (!userReq) {
      console.log('[API Approve] Request not found for ID:', id);
      return NextResponse.json({ error: 'Richiesta non trovata o già processata' }, { status: 404 });
    }

    console.log('[API Approve] Found user:', userReq.name);

    // Generate secure password and hash it
    const tempPassword = generateSecurePassword();
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(tempPassword, salt);

    // Update the user
    const now = new Date().toISOString();
    await db.update(users)
      .set({
        status: 'ACTIVE',
        reviewed_at: now,
        reviewed_by: session.id,
        password: hashedPassword,
        must_change_password: true,
        temp_password_at: now
      })
      .where(eq(users.id, id));

    // Log the approval
    logAudit({
      userId: session.id,
      userEmail: session.email,
      userRole: session.role,
      action: 'UPDATE',
      entity: 'user',
      entityId: id,
      newValue: { status: 'ACTIVE', reviewed_by: session.id, must_change_password: 1 },
      details: `Approvata richiesta di accesso per ${userReq.name}`
    });

    return NextResponse.json({ success: true, tempPassword }, { status: 200 });
  } catch (error) {
    console.error('Error approving request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
