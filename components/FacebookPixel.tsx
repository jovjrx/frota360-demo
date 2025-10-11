/**
 * Facebook Pixel Component
 * 
 * Componente para inicializar o Facebook Pixel no client-side
 * Deve ser incluído no _app.tsx
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { initFacebookPixel, trackPageView } from '@/lib/facebook/client-events';

export default function FacebookPixel() {
  const router = useRouter();

  useEffect(() => {
    // Inicializar o pixel
    initFacebookPixel();

    // Track pageview em mudanças de rota
    const handleRouteChange = () => {
      trackPageView();
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return null;
}

