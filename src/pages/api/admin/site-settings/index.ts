// API para gerenciar configurações globais do site
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSiteSettings, saveSiteSettings } from '@/lib/site-settings';
import { getSession } from '@/lib/session/ironSession';
import { SiteSettings } from '@/types/site-settings';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { method, body } = req;

    if (method === 'GET') {
      // Buscar configurações - público (para o provider carregar)
      const settings = await getSiteSettings();
      return res.status(200).json({ success: true, settings });
    }

    if (method === 'POST') {
      // Salvar configurações - precisa de autenticação admin
      const session = await getSession(req, res);
      
      if (!session?.isLoggedIn || (session.role !== 'admin' && session.user?.role !== 'admin')) {
        return res.status(401).json({ success: false, error: 'Não autorizado' });
      }

      const settingsData: Partial<SiteSettings> = body;
      const updatedBy = session.email || session.user?.email || 'unknown';

      await saveSiteSettings(settingsData, updatedBy);

      return res.status(200).json({ 
        success: true, 
        message: 'Configurações salvas com sucesso' 
      });
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de configurações do site:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao processar requisição' 
    });
  }
}

