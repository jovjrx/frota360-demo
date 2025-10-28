import { NextRequest, NextResponse } from 'next/server';

/**
 * PROTEÇÃO DEMO: Previne ações destrutivas em ambiente de demonstração
 */

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export function isPublicDemo(): boolean {
  return process.env.DEMO_PUBLIC_SITE === 'true';
}

// Métodos HTTP que modificam dados
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Endpoints que DEVEM ser bloqueados em modo demo
const BLOCKED_ENDPOINTS = [
  '/api/payments',
  '/api/payout',
  '/api/drivers/update',
  '/api/drivers/create',
  '/api/drivers/delete',
  '/api/settings/update',
  '/api/integrations/update',
  '/api/upload',
  '/api/files/',
  '/api/notifications/send',
  '/api/auth/register',
  '/api/import',
  '/api/export',
];

// Endpoints permitidos apenas com credenciais demo
const DEMO_ONLY_ENDPOINTS = [
  '/api/auth/login',
];

export function shouldBlockAction(req: NextRequest): boolean {
  const pathname = req.nextUrl.pathname;
  const method = req.method;
  
  // Se não for modo demo, não bloquear
  if (!isDemoMode()) {
    return false;
  }
  
  // Bloquear todos os métodos de escrita em endpoints críticos
  if (WRITE_METHODS.includes(method)) {
    // Verificar se pathname inclui algum endpoint bloqueado
    const isBlockedEndpoint = BLOCKED_ENDPOINTS.some(endpoint => 
      pathname.includes(endpoint)
    );
    
    if (isBlockedEndpoint) {
      return true; // BLOQUEAR
    }
  }
  
  return false; // PERMITIR
}

export function getBlockedResponse(originalUrl: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Ação desabilitada',
      message: 'Este é um ambiente de demonstração. Ações de modificação estão desabilitadas.',
      demo: true,
      originalUrl,
    },
    { status: 403 }
  );
}

// Middleware do Next.js
export function demoMiddleware(req: NextRequest): NextResponse | null {
  // Verificar se deve bloquear
  if (shouldBlockAction(req)) {
    return getBlockedResponse(req.nextUrl.pathname);
  }
  
  // Permitir
  return null;
}

