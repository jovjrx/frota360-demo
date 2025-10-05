import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebaseAdmin';
import { calculateFleetRecord } from '@/schemas/fleet-record';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  
  if (!session?.user || session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    return handleGet(id as string, res);
  } else if (req.method === 'PUT') {
    return handlePut(id as string, req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(id as string, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(id: string, res: NextApiResponse) {
  try {
    const doc = await db.collection('fleet_records').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    return res.status(200).json({
      success: true,
      record: { id: doc.id, ...doc.data() },
    });
  } catch (error: any) {
    console.error('Error fetching fleet record:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handlePut(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = req.body;
    
    // Calcular valores
    const calculated = calculateFleetRecord(data);
    
    // Atualizar
    const updateData = {
      ...calculated,
      updatedAt: new Date().toISOString(),
    };
    
    await db.collection('fleet_records').doc(id).update(updateData);
    
    return res.status(200).json({
      success: true,
      record: { id, ...updateData },
    });
  } catch (error: any) {
    console.error('Error updating fleet record:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleDelete(id: string, res: NextApiResponse) {
  try {
    await db.collection('fleet_records').doc(id).delete();
    
    return res.status(200).json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting fleet record:', error);
    return res.status(500).json({ error: error.message });
  }
}
