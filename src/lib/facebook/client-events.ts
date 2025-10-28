/**
 * Facebook Pixel - Client-Side Events
 * 
 * Helper para disparar eventos do Facebook Pixel no client-side
 */

import { facebookConfig, isFacebookPixelEnabled } from './config';

declare global {
  interface Window {
    fbq: any;
  }
}

/**
 * Inicializar o Facebook Pixel
 */
export const initFacebookPixel = () => {
  if (!isFacebookPixelEnabled()) return;

  // Verificar se já foi inicializado
  if (window.fbq) return;

  // Carregar script do Facebook Pixel
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js'
  );

  window.fbq('init', facebookConfig.pixelId);
  
  // PageView inicial
  window.fbq('track', 'PageView');
};

/**
 * Disparar evento PageView
 */
export const trackPageView = () => {
  if (!isFacebookPixelEnabled() || !window.fbq) return;
  window.fbq('track', 'PageView');
};

/**
 * Disparar evento ViewContent
 * @param contentName - Nome do conteúdo visualizado
 * @param contentCategory - Categoria do conteúdo
 */
export const trackViewContent = (contentName: string, contentCategory?: string) => {
  if (!isFacebookPixelEnabled() || !window.fbq) return;
  
  window.fbq('track', 'ViewContent', {
    content_name: contentName,
    content_category: contentCategory || 'page',
  });
};

/**
 * Disparar evento InitiateCheckout
 * @param contentName - Nome do processo iniciado
 */
export const trackInitiateCheckout = (contentName: string) => {
  if (!isFacebookPixelEnabled() || !window.fbq) return;
  
  window.fbq('track', 'InitiateCheckout', {
    content_name: contentName,
  });
};

/**
 * Disparar evento CompleteRegistration
 * @param status - Status da conclusão
 * @param contentName - Nome do registro
 */
export const trackCompleteRegistration = (status: string, contentName: string) => {
  if (!isFacebookPixelEnabled() || !window.fbq) return;
  
  window.fbq('track', 'CompleteRegistration', {
    status,
    content_name: contentName,
  });
};

/**
 * Disparar evento Lead
 * @param contentName - Nome do lead
 */
export const trackLead = (contentName: string) => {
  if (!isFacebookPixelEnabled() || !window.fbq) return;
  
  window.fbq('track', 'Lead', {
    content_name: contentName,
  });
};

/**
 * Disparar evento customizado
 * @param eventName - Nome do evento
 * @param params - Parâmetros adicionais
 */
export const trackCustomEvent = (eventName: string, params?: Record<string, any>) => {
  if (!isFacebookPixelEnabled() || !window.fbq) return;
  
  window.fbq('trackCustom', eventName, params || {});
};


