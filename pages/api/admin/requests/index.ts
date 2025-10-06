import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import { requireAdmin } from '@/lib/auth/helpers';
import { ApiResponse, PaginatedResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedResponse | ApiResponse>
) {
  // Verificar autenticação admin
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    try {
      const { status, page = '1', limit = '10' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Query base
      let query = db.collection('requests').orderBy('createdAt', 'desc');

      // Filtrar por status se fornecido
      if (status && status !== 'all') {
        query = query.where('status', '==', status) as any;
      }

      // Contar total
      const snapshot = await query.get();
      const total = snapshot.size;

      // Buscar com paginação
      const docs = snapshot.docs.slice(offset, offset + limitNum);
      const requests = docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({
        success: true,
        data: requests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar solicitações',
        message: error.message,
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
  });
}
