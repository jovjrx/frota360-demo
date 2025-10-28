/**
 * Configuração do Facebook Pixel
 * 
 * Para configurar:
 * 1. Adicione NEXT_PUBLIC_FACEBOOK_PIXEL_ID ao .env
 * 2. Adicione FACEBOOK_ACCESS_TOKEN ao .env (para eventos server-side)
 */

export const facebookConfig = {
  pixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '',
  accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
  testEventCode: process.env.FACEBOOK_TEST_EVENT_CODE || '', // Opcional para testes
  enabled: !!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
};

// Verificar se está configurado
export const isFacebookPixelEnabled = () => {
  return facebookConfig.enabled && facebookConfig.pixelId.length > 0;
};

// Verificar se eventos server-side estão habilitados
export const isFacebookServerEventsEnabled = () => {
  return isFacebookPixelEnabled() && facebookConfig.accessToken.length > 0;
};


