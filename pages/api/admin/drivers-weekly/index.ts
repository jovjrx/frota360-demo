import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecord, calculateDriverWeeklyRecord } from '@/schemas/driver-weekly-record';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  
  if (!session?.user || session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { driverId, weekStart, weekEnd, status, page = '1', limit = '50' } = req.query;
    
    let query = db.collection('driver_weekly_records').orderBy('weekStart', 'desc');
    
    if (driverId) {
      query = query.where('driverId', '==', driverId) as any;
    }
    
    if (status) {
      query = query.where('paymentStatus', '==', status) as any;
    }
    
    const snapshot = await query.get();
    let records: DriverWeeklyRecord[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      records.push({ id: doc.id, ...data } as DriverWeeklyRecord);
    });
    
    // Filtrar por semana se necessário
    if (weekStart) {
      records = records.filter(r => r.weekStart >= weekStart);
    }
    
    if (weekEnd) {
      records = records.filter(r => r.weekEnd <= weekEnd);
    }
    
    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedRecords = records.slice(startIndex, endIndex);
    
    return res.status(200).json({
      success: true,
      records: paginatedRecords,
      total: records.length,
      page: pageNum,
      totalPages: Math.ceil(records.length / limitNum),
    });
  } catch (error: any) {
    console.error('Error fetching driver weekly records:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = req.body;
    
    // Calcular valores
    const calculated = calculateDriverWeeklyRecord(data);
    
    // Adicionar metadados
    const record: Partial<DriverWeeklyRecord> = {
      ...calculated,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Salvar no Firebase
    const docRef = await db.collection('driver_weekly_records').add(record);
    
    return res.status(201).json({
      success: true,
      record: { id: docRef.id, ...record },
    });
  } catch (error: any) {
    console.error('Error creating driver weekly record:', error);
    return res.status(500).json({ error: error.message });
  }
}
