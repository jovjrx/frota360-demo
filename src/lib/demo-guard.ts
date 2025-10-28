import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Verifica se está em modo demo e bloqueia ações de escrita (POST, PUT, DELETE)
 */
export function checkDemoMode(req: NextApiRequest, res: NextApiResponse): boolean {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const isWriteAction = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);

  if (isDemo && isWriteAction) {
    res.status(403).json({
      success: false,
      error: 'Ação desabilitada em modo demonstração',
      message: 'Esta funcionalidade está desabilitada. O sistema está em modo demonstração e não permite alterações.',
    });
    return true;
  }

  return false;
}

/**
 * Verifica se está em modo demo para exibir mensagens ao usuário
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

