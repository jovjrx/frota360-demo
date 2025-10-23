import type { NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { getFinancialConfig, updateFinancialConfig } from '@/lib/finance/config';

async function handler(req: SessionRequest, res: NextApiResponse) {
  try {
    // Verificar autenticação admin
    const user = req.session.user;
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (req.method === 'GET') {
      const config = await getFinancialConfig();
      return res.status(200).json(config);
    }

    if (req.method === 'POST') {
      const { adminFeePercent, adminFeeFixedDefault } = req.body;
      
      const updated = await updateFinancialConfig({
        adminFeePercent: typeof adminFeePercent === 'number' ? adminFeePercent : undefined,
        adminFeeFixedDefault: typeof adminFeeFixedDefault === 'number' ? adminFeeFixedDefault : undefined,
      });

      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('[financial-config] Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export default withIronSessionApiRoute(handler, sessionOptions);
