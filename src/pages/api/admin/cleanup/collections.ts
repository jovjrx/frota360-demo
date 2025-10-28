import type { NextApiRequest, NextApiResponse } from 'next';
import { cleanupUnusedCollections } from '@/lib/cleanup/remove-collections';

/**
 * Endpoint para limpar coleções não usadas
 * POST /api/admin/cleanup/collections
 * 
 * ⚠️ Apenas para uso admin, deve estar protegido por autenticação
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // TODO: Adicionar verificação de autenticação admin

  try {
    await cleanupUnusedCollections();
    return res.status(200).json({
      success: true,
      message: 'Coleções não usadas foram removidas com sucesso',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Cleanup] Erro:', error);
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
}
