/**
 * Google Analytics - Custom Events
 * 
 * Helper para disparar eventos customizados do Google Analytics
 */

declare global {
  interface Window {
    gtag: any;
  }
}

/**
 * Verificar se GA está disponível
 */
const isGAAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag !== 'undefined';
};

/**
 * Disparar evento customizado do Google Analytics
 */
export const trackGAEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (!isGAAvailable()) {
    console.log('[GA] Not available - skipping event:', eventName);
    return;
  }

  try {
    window.gtag('event', eventName, eventParams || {});
    console.log('[GA] Event tracked:', eventName, eventParams);
  } catch (error) {
    console.error('[GA] Error tracking event:', error);
  }
};

/**
 * Track visualização de conteúdo
 */
export const trackGAViewContent = (contentName: string, contentCategory?: string) => {
  trackGAEvent('view_item', {
    content_name: contentName,
    content_category: contentCategory || 'page',
  });
};

/**
 * Track início de checkout/cadastro
 */
export const trackGABeginCheckout = (value?: number, currency?: string) => {
  trackGAEvent('begin_checkout', {
    value: value || 0,
    currency: currency || 'EUR',
  });
};

/**
 * Track conversão/registro completo
 */
export const trackGAConversion = (eventLabel: string, value?: number) => {
  trackGAEvent('conversion', {
    event_label: eventLabel,
    value: value || 0,
    currency: 'EUR',
  });
};

/**
 * Track geração de lead
 */
export const trackGAGenerateLead = (eventLabel: string, value?: number) => {
  trackGAEvent('generate_lead', {
    event_label: eventLabel,
    value: value || 0,
    currency: 'EUR',
  });
};

/**
 * Track cadastro/signup
 */
export const trackGASignUp = (method: string) => {
  trackGAEvent('sign_up', {
    method,
  });
};

