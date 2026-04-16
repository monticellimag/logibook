import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseISO, subDays, setHours, setMinutes, isAfter } from 'date-fns';
import { getSession } from '@/lib/auth';
import db from '@/lib/sqlite';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const depotId = searchParams.get('depotId');
  
  let query = 'SELECT * FROM bookings WHERE 1=1';
  let params: any[] = [];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }

  if (user.role === 'admin' || user.role === 'gate') {
    if (user.depotId) {
      query += ' AND depotId = ?';
      params.push(user.depotId);
    } else if (depotId) {
      query += ' AND depotId = ?';
      params.push(depotId);
    }
    const bookings = db.prepare(query).all(...params);
    return NextResponse.json(bookings);
  } else {
    if (!depotId) {
      return NextResponse.json({ error: 'Specifica un deposito' }, { status: 400 });
    }
    query += ' AND depotId = ?';
    params.push(depotId);

    const bookings = db.prepare(query).all(...params) as any[];

    const safeBookings = bookings.map((b: any) => {
      if (b.userId === user.id) {
        return b;
      }
      return { time: b.time, date: b.date, isBooked: true };
    });
    return NextResponse.json(safeBookings);
  }
}

export async function POST(request: Request) {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const depotId = formData.get('depotId') as string;
    const carrierName = formData.get('carrierName') as string;
    const licensePlate = formData.get('licensePlate') as string;
    const company = formData.get('company') as string;
    const phone = formData.get('phone') as string;
    const orderRef = formData.get('orderRef') as string;
    const notes = formData.get('notes') as string;
    const operationType = formData.get('operationType') as string || 'Carico completo o parziale';
    const pallets = parseInt(formData.get('pallets') as string) || 0;
    const difficulty = formData.get('difficulty') as string || 'standard';
    const isEmergency = formData.get('isEmergency') === 'true' ? 1 : 0;
    const file = formData.get('file') as File | null;
    
    if (!date || !time || !carrierName || !licensePlate || !depotId || !orderRef) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    // Skip checks for emergency bookings
    if (!isEmergency) {
      const targetDate = parseISO(date);
      const deadline = setMinutes(setHours(subDays(targetDate, 1), 15), 0);
      if (isAfter(new Date(), deadline)) {
        return NextResponse.json({ error: 'Tempo limite di prenotazione scaduto.' }, { status: 403 });
      }
      
      const countStmt = db.prepare('SELECT COUNT(*) as existingCount FROM bookings WHERE date = ? AND time = ? AND depotId = ?');
      const { existingCount } = countStmt.get(date, time, depotId) as { existingCount: number };
      
      if (existingCount >= 10) {
        return NextResponse.json({ error: 'Capacità massima raggiunta per questo slot (10 mezzi).' }, { status: 409 });
      }
    }

    let attachmentUrl = null;
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const ext = path.extname(file.name);
      const uuidName = `${crypto.randomUUID()}${ext}`;
      const savePath = path.join(UPLOADS_DIR, uuidName);
      
      fs.writeFileSync(savePath, buffer);
      attachmentUrl = `/uploads/${uuidName}`;
    }
    
    const newBooking = {
      id: crypto.randomUUID(),
      userId: user.id,
      depotId,
      date,
      time,
      carrierName,
      licensePlate,
      company: company || '',
      phone: phone || '',
      orderRef,
      notes: notes || '',
      status: 'pending',
      gateStatus: 'expected', // expected, arrived, completed
      operationType,         
      pallets,
      difficulty,
      isEmergency,
      attachment: attachmentUrl,
      createdAt: new Date().toISOString()
    };
    
    const insertStmt = db.prepare(`
      INSERT INTO bookings (id, userId, depotId, date, time, carrierName, licensePlate, company, phone, orderRef, notes, status, gateStatus, operationType, pallets, difficulty, isEmergency, attachment, createdAt)
      VALUES (@id, @userId, @depotId, @date, @time, @carrierName, @licensePlate, @company, @phone, @orderRef, @notes, @status, @gateStatus, @operationType, @pallets, @difficulty, @isEmergency, @attachment, @createdAt)
    `);
    
    insertStmt.run(newBooking);
    
    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Error saving booking:', error);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
