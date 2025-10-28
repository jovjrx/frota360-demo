/**
 * Hook para disparar eventos de tracking (Facebook + Google Analytics)
 * 
 * Envia eventos para Facebook (client + server) e Google Analytics
 */

import { useCallback } from 'react';
import {
  trackViewContent,
  trackInitiateCheckout,
  trackCompleteRegistration,
  trackLead,
  trackCustomEvent,
} from '@/lib/facebook/client-events';
import {
  trackGAViewContent,
  trackGABeginCheckout,
  trackGAConversion,
  trackGAGenerateLead,
} from '@/lib/google/analytics';

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  externalId?: string;
}

/**
 * Hook unificado de tracking
 * Dispara eventos para Facebook Pixel e Google Analytics simultaneamente
 */
export const useFacebookTracking = () => {
  /**
   * Enviar evento também para o servidor
   */
  const sendServerEvent = useCallback(
    async (eventName: string, userData?: UserData, customData?: Record<string, any>) => {
      try {
        await fetch('/api/tracking/facebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName,
            eventSourceUrl: window.location.href,
            userData,
            customData,
          }),
        });
      } catch (error) {
        console.error('[Facebook] Failed to send server event:', error);
      }
    },
    []
  );

  /**
   * Track ViewContent (visualização de conteúdo)
   */
  const trackContentView = useCallback(
    (contentName: string, contentCategory?: string, userData?: UserData) => {
      // Facebook Client-side
      trackViewContent(contentName, contentCategory);
      
      // Facebook Server-side
      sendServerEvent('ViewContent', userData, {
        content_name: contentName,
        content_category: contentCategory || 'page',
      });

      // Google Analytics
      trackGAViewContent(contentName, contentCategory);
    },
    [sendServerEvent]
  );

  /**
   * Track InitiateCheckout (início de cadastro/processo)
   */
  const trackCheckoutStart = useCallback(
    (contentName: string, userData?: UserData) => {
      // Facebook Client-side
      trackInitiateCheckout(contentName);
      
      // Facebook Server-side
      sendServerEvent('InitiateCheckout', userData, {
        content_name: contentName,
      });

      // Google Analytics
      trackGABeginCheckout();
    },
    [sendServerEvent]
  );

  /**
   * Track CompleteRegistration (cadastro completo)
   */
  const trackRegistrationComplete = useCallback(
    (status: string, contentName: string, userData?: UserData) => {
      // Facebook Client-side
      trackCompleteRegistration(status, contentName);
      
      // Facebook Server-side
      sendServerEvent('CompleteRegistration', userData, {
        status,
        content_name: contentName,
      });

      // Google Analytics
      trackGAConversion(contentName);
      trackGAGenerateLead(contentName);
    },
    [sendServerEvent]
  );

  /**
   * Track Lead (geração de lead)
   */
  const trackLeadGeneration = useCallback(
    (contentName: string, userData?: UserData) => {
      // Facebook Client-side
      trackLead(contentName);
      
      // Facebook Server-side
      sendServerEvent('Lead', userData, {
        content_name: contentName,
      });

      // Google Analytics
      trackGAGenerateLead(contentName);
    },
    [sendServerEvent]
  );

  /**
   * Track evento customizado
   */
  const trackCustom = useCallback(
    (eventName: string, params?: Record<string, any>, userData?: UserData) => {
      // Client-side
      trackCustomEvent(eventName, params);
      
      // Server-side
      sendServerEvent(eventName, userData, params);
    },
    [sendServerEvent]
  );

  return {
    trackContentView,
    trackCheckoutStart,
    trackRegistrationComplete,
    trackLeadGeneration,
    trackCustom,
  };
};


