// Serviço para gerenciar configurações do site em arquivos locais
import { siteSettingsCache } from './cache/site-settings-cache';
import { SiteSettings, DEFAULT_SITE_SETTINGS } from '@/types/site-settings';

// Importa configurações locais - SEM Firebase
const siteSettings = require('@/demo/siteSettings/global.json') as SiteSettings;

const DOCUMENT_ID = 'global';

/**
 * Busca configurações do site dos arquivos locais, com cache
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  // Verifica cache primeiro
  const cached = siteSettingsCache.get(DOCUMENT_ID);
  if (cached) {
    return cached;
  }

  try {
    // Retorna configurações locais
    const data = siteSettings as SiteSettings;
    // Armazena no cache
    siteSettingsCache.set(DOCUMENT_ID, data);
    return data;
  } catch (error) {
    console.error('Erro ao buscar configurações do site:', error);
    
    // Retorna valores padrão se ocorrer erro
    const defaults: SiteSettings = {
      id: DOCUMENT_ID,
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };

    return defaults;
  }
}

/**
 * Salva configurações do site (localmente apenas no cache)
 * NOTA: Sem Firebase, as configurações são apenas em cache/sessão
 */
export async function saveSiteSettings(
  settings: Partial<SiteSettings>,
  updatedBy: string
): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    const settingsToSave: SiteSettings = {
      id: DOCUMENT_ID,
      branding: settings.branding || DEFAULT_SITE_SETTINGS.branding,
      colors: settings.colors || DEFAULT_SITE_SETTINGS.colors,
      contact: settings.contact || DEFAULT_SITE_SETTINGS.contact,
      smtp: settings.smtp || DEFAULT_SITE_SETTINGS.smtp,
      seo: settings.seo || DEFAULT_SITE_SETTINGS.seo,
      tracking: settings.tracking || DEFAULT_SITE_SETTINGS.tracking,
      updatedAt: now,
      updatedBy,
    };

    // Salva apenas no cache (sem persistência permanente)
    siteSettingsCache.set(DOCUMENT_ID, settingsToSave);
    
    console.log('Configurações salvas no cache (apenas sessão - sem Firebase)');
    
  } catch (error) {
    console.error('Erro ao salvar configurações do site:', error);
    throw error;
  }
}

/**
 * Busca configuração específica por idioma
 */
export async function getSiteSettingsForLocale(locale: 'pt' | 'en' = 'pt') {
  const settings = await getSiteSettings();
  return settings.seo[locale];
}

/**
 * Busca configurações de branding
 */
export async function getSiteBranding() {
  const settings = await getSiteSettings();
  return settings.branding;
}

/**
 * Busca configurações de cores
 */
export async function getSiteColors() {
  const settings = await getSiteSettings();
  return settings.colors;
}

/**
 * Busca configurações de tracking
 */
export async function getSiteTracking() {
  const settings = await getSiteSettings();
  return settings.tracking;
}

/**
 * Busca informações de contato
 */
export async function getSiteContact() {
  const settings = await getSiteSettings();
  return settings.contact;
}

/**
 * Busca configurações SMTP
 */
export async function getSiteSMTP() {
  const settings = await getSiteSettings();
  return settings.smtp;
}

