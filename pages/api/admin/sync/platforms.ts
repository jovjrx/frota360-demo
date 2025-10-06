import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';

/**
 * POST /api/admin/sync/platforms
 * Inicia sincronização das plataformas Uber e Bolt
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação admin
    const session = await getSession(req, res);
    if (!session?.isLoggedIn) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const isAdmin = session.role === 'admin' || session.user?.role === 'admin';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Simular início da sincronização
    // Em um ambiente real, aqui você iniciaria jobs de sincronização
    // com as APIs da Uber e Bolt

    console.log('Sincronização das plataformas iniciada por:', session.userId);

    // Aqui você pode adicionar lógica para:
    // 1. Disparar jobs de sincronização com Uber API
    // 2. Disparar jobs de sincronização com Bolt API
    // 3. Atualizar status de sincronização no banco
    // 4. Enviar notificações

    return res.status(200).json({
      message: 'Sincronização iniciada com sucesso',
      timestamp: new Date().toISOString(),
      platforms: ['uber', 'bolt'],
      status: 'started',
    });

  } catch (error) {
    console.error('Erro ao iniciar sincronização:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}