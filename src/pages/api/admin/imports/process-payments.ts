import { NextApiRequest, NextApiResponse } from 'next';
import { processWeeklyPayments } from '@/lib/api/payment-processor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { weekId } = req.body;

    if (!weekId) {
      return res.status(400).json({ error: 'weekId is required' });
    }

    console.log(`[process-payments] Iniciando processamento para ${weekId}`);

    // Process all payments for the week using the central processor
    const results = await processWeeklyPayments(weekId);

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.log(`[process-payments] Completado: ${successCount} sucesso, ${errorCount} erros`);

    res.status(200).json({ 
      success: true, 
      processed: successCount,
      errors: errorCount > 0 ? results.filter(r => !r.success) : undefined,
      message: `${successCount} pagamentos processados com sucesso`
    });
  } catch (error: any) {
    console.error('[API] Erro ao processar pagamentos:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
