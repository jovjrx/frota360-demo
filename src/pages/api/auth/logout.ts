import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    
    // Limpar todos os dados da sessão
    session.userId = undefined;
    session.user = undefined;
    
    // Salvar sessão vazia (destrói a sessão)
    await session.destroy();

    return res.status(200).json({ 
      success: true,
      message: 'Logout realizado com sucesso' 
    });
  } catch (error: any) {
    console.error('Error during logout:', error);
    return res.status(500).json({ 
      error: 'Erro ao fazer logout' 
    });
  }
}

