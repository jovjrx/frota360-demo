/**
 * Facebook Conversions API - Server-Side Events
 * 
 * Envia eventos para o Facebook via servidor para maior confiabilidade
 */

import { facebookConfig, isFacebookServerEventsEnabled } from './config';
import crypto from 'crypto';

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  externalId?: string;
}

interface ServerEventParams {
  eventName: string;
  eventSourceUrl: string;
  userData?: UserData;
  customData?: Record<string, any>;
  userAgent?: string;
  ip?: string;
}

/**
 * Hash de dados sensíveis (SHA256)
 */
const hashData = (data: string): string => {
  if (!data) return '';
  return crypto
    .createHash('sha256')
    .update(data.toLowerCase().trim())
    .digest('hex');
};

/**
 * Normalizar dados do usuário
 */
const normalizeUserData = (userData?: UserData) => {
  if (!userData) return {};

  const normalized: any = {};

  if (userData.email) {
    normalized.em = hashData(userData.email);
  }
  if (userData.phone) {
    // Remover espaços e caracteres especiais
    const cleanPhone = userData.phone.replace(/\D/g, '');
    normalized.ph = hashData(cleanPhone);
  }
  if (userData.firstName) {
    normalized.fn = hashData(userData.firstName);
  }
  if (userData.lastName) {
    normalized.ln = hashData(userData.lastName);
  }
  if (userData.city) {
    normalized.ct = hashData(userData.city);
  }
  if (userData.country) {
    normalized.country = hashData(userData.country);
  }
  if (userData.externalId) {
    normalized.external_id = userData.externalId;
  }

  return normalized;
};

/**
 * Enviar evento para o Facebook Conversions API
 */
export const sendServerEvent = async ({
  eventName,
  eventSourceUrl,
  userData,
  customData,
  userAgent,
  ip,
}: ServerEventParams): Promise<boolean> => {
  if (!isFacebookServerEventsEnabled()) {
    console.log('[Facebook] Server events disabled - skipping');
    return false;
  }

  try {
    const eventTime = Math.floor(Date.now() / 1000);

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: eventTime,
          event_source_url: eventSourceUrl,
          action_source: 'website',
          user_data: {
            ...normalizeUserData(userData),
            client_ip_address: ip,
            client_user_agent: userAgent,
          },
          custom_data: customData || {},
        },
      ],
      test_event_code: facebookConfig.testEventCode || undefined,
    };

    const url = `https://graph.facebook.com/v18.0/${facebookConfig.pixelId}/events?access_token=${facebookConfig.accessToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Facebook] Error sending server event:', result);
      return false;
    }

    console.log('[Facebook] Server event sent:', eventName, result);
    return true;
  } catch (error) {
    console.error('[Facebook] Failed to send server event:', error);
    return false;
  }
};

/**
 * Helper para extrair IP do request
 */
export const getClientIp = (req: any): string => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    ''
  );
};

/**
 * Helper para extrair User Agent do request
 */
export const getClientUserAgent = (req: any): string => {
  return req.headers['user-agent'] || '';
};


