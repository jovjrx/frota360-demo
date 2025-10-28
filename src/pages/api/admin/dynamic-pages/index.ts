import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { db } from '@/lib/firebaseAdmin';

interface DynamicPage {
  slug: string;
  title?: string;
  description?: string;
  blocks: any[];
  createdAt?: any;
  updatedAt?: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.isLoggedIn || session.user?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Listar todas as páginas
      const pagesSnapshot = await db.collection('pages').get();
      const pages = pagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ success: true, pages });
    }

    if (req.method === 'POST') {
      // Criar nova página
      const { slug, title, blocks } = req.body;

      if (!slug) {
        return res.status(400).json({ error: 'Slug é obrigatório' });
      }

      // Verificar se slug já existe
      const existingPage = await db.collection('pages').doc(slug).get();
      if (existingPage.exists) {
        return res.status(400).json({ error: 'Slug já existe' });
      }

      // Verificar se slug não é usado por motorista
      const driversRef = db.collection('drivers');
      const driversQuery = await driversRef.where('slug', '==', slug).limit(1).get();
      if (!driversQuery.empty) {
        return res.status(400).json({ error: 'Slug já está em uso por um motorista' });
      }

      // Criar página
      const pageData: DynamicPage = {
        slug,
        title: title || '',
        description: '',
        blocks: blocks || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('pages').doc(slug).set(pageData);

      return res.status(200).json({ success: true, message: 'Página criada com sucesso' });
    }
  } catch (error) {
    console.error('Erro ao gerenciar páginas:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  }
}

