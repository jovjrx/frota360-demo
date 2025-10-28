import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { db } from '@/lib/firebaseAdmin';
import { invalidatePageCache } from '@/lib/pages';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.isLoggedIn || session.user?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const slug = req.query.slug as string;

  try {
    if (req.method === 'GET') {
      const doc = await db.collection('pages').doc(slug).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Página não encontrada' });
      }

      return res.status(200).json({ success: true, page: { id: doc.id, ...doc.data() } });
    }

    if (req.method === 'PUT') {
      const { blocks, title, description } = req.body;

      // Home não pode ser deletada, mas pode ser editada
      if (slug === 'home') {
        // Validar que não está removendo todos os blocos
        if (!blocks || blocks.length === 0) {
          return res.status(400).json({ error: 'Home deve ter pelo menos um bloco' });
        }
      }

      await db.collection('pages').doc(slug).update({
        blocks,
        title,
        description,
        updatedAt: new Date(),
      });

      // Invalida cache após atualização
      invalidatePageCache(slug);

      return res.status(200).json({ success: true, message: 'Página atualizada com sucesso' });
    }

    if (req.method === 'DELETE') {
      // Não permitir deletar home
      if (slug === 'home') {
        return res.status(400).json({ error: 'Página home não pode ser deletada' });
      }

      await db.collection('pages').doc(slug).delete();

      // Invalida cache após deleção
      invalidatePageCache(slug);

      return res.status(200).json({ success: true, message: 'Página deletada com sucesso' });
    }
  } catch (error) {
    console.error('Erro ao gerenciar página:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  }
}

