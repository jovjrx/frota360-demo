import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';

/**
 * GET /api/painel/contracheques
 * Retorna os contracheques do motorista logado
 * 
 * Query params:
 * - status: 'pending' | 'paid' (opcional)
 * - limit: número de registros (padrão: 12)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const driverId = session.userId;

    // Parâmetros da query
    const { status, limit = '12' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Buscar registros semanais do motorista
    let query = adminDb
      .collection('driverWeeklyRecords')
      .where('driverId', '==', driverId);

    // Filtrar por status se especificado
    if (status && (status === 'pending' || status === 'paid')) {
      query = query.where('paymentStatus', '==', status);
    }

    // NOTA: orderBy requer índice composto. Solução: ordenar em memória
    const recordsSnapshot = await query.get();
    
    // Ordenar em memória e limitar
    const sortedDocs = recordsSnapshot.docs
      .map(doc => ({ doc, data: doc.data() }))
      .sort((a, b) => {
        const dateA = new Date(a.data.weekStart || '');
        const dateB = new Date(b.data.weekStart || '');
        return dateB.getTime() - dateA.getTime(); // desc
      })
      .slice(0, limitNum);

    // Mapear registros
    const contracheques = sortedDocs.map(({ doc, data }) => {
      return {
        id: doc.id,
        weekId: data.weekId,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        
        // Receitas
        uberTotal: data.uberTotal || 0,
        boltTotal: data.boltTotal || 0,
        ganhosTotal: data.ganhosTotal || 0,
        
        // Cálculos
        ivaValor: data.ivaValor || 0,
        ganhosMenosIVA: data.ganhosMenosIVA || 0,
        despesasAdm: data.despesasAdm || 0,
        
        // Despesas
        combustivel: data.combustivel || 0,
        viaverde: data.viaverde || 0,
        aluguel: data.aluguel || 0,
        totalDespesas: data.totalDespesas || 0,
        
        // Repasse
        repasse: data.repasse || 0,
        
        // Pagamento
        iban: data.iban || null,
        paymentStatus: data.paymentStatus || 'pending',
        paymentDate: data.paymentDate || null,
        
        // Metadados
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      };
    });

    return res.status(200).json({
      contracheques,
      total: contracheques.length,
    });

  } catch (error) {
    console.error('Erro ao buscar contracheques:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
