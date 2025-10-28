import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { Goal, CreateGoal } from '@/schemas/goal';
import { getSession } from '@/lib/session/ironSession';

type ApiResponse = 
  | { goals: Goal[] }
  | { goal: Goal }
  | { success: boolean; message: string }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    // GET - Listar todas as goals
    if (req.method === 'GET') {
      const goalsSnap = await adminDb
        .collection('goals')
        .orderBy('nivel', 'asc')
        .get();

      const goals = goalsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Goal));

      return res.status(200).json({ goals });
    }

    // POST - Criar nova goal
    if (req.method === 'POST') {
      const session = await getSession(req, res);
      if (!session?.isLoggedIn || (session.role !== 'admin' && session.user?.role !== 'admin')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const data: CreateGoal = req.body;
      const docRef = adminDb.collection('goals').doc();
      const newGoal: Goal = {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await docRef.set(newGoal);
      return res.status(201).json({ goal: newGoal, success: true, message: 'Goal criada com sucesso' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Goals API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
