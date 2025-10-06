import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session?.isLoggedIn) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { importId } = req.query;

    if (!importId || typeof importId !== 'string') {
      return res.status(400).json({ error: 'importId é obrigatório' });
    }

    const db = getFirestore();

    // Buscar importações com este importId
    const importsSnapshot = await db.collection('weeklyDataImports')
      .where('importId', '==', importId)
      .get();

    if (importsSnapshot.empty) {
      return res.status(404).json({ error: 'Importação não encontrada' });
    }

    const imports = importsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{ id: string; processed: boolean; [key: string]: any }>;

    const allProcessed = imports.every(imp => imp.processed);
    const anyProcessed = imports.some(imp => imp.processed);

    return res.status(200).json({
      importId,
      totalFiles: imports.length,
      processed: imports.filter(imp => imp.processed).length,
      pending: imports.filter(imp => !imp.processed).length,
      status: allProcessed ? 'completed' : anyProcessed ? 'processing' : 'pending',
      imports,
    });
  } catch (error) {
    console.error('Error fetching import status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
