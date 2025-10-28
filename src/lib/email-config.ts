// Utilitários para configuração de email usando valores do Firebase
import { getSiteContact, getSiteSMTP, getSiteBranding } from './site-settings';
import type { ContactInfo, SMTPConfig, SiteBranding } from '@/types/site-settings';
import { DEFAULT_SITE_SETTINGS } from '@/types/site-settings';

/**
 * Busca informações de contato para templates de email
 */
export async function getEmailContactInfo(): Promise<ContactInfo> {
  try {
    return await getSiteContact();
  } catch (error) {
    console.error('Erro ao buscar informações de contato:', error);
    return DEFAULT_SITE_SETTINGS.contact;
  }
}

/**
 * Busca configurações SMTP
 */
export async function getEmailSMTPConfig(): Promise<SMTPConfig> {
  try {
    return await getSiteSMTP();
  } catch (error) {
    console.error('Erro ao buscar configurações SMTP:', error);
    return DEFAULT_SITE_SETTINGS.smtp;
  }
}

/**
 * Busca branding para templates de email
 */
export async function getEmailBranding(): Promise<SiteBranding> {
  try {
    return await getSiteBranding();
  } catch (error) {
    console.error('Erro ao buscar branding:', error);
    return DEFAULT_SITE_SETTINGS.branding;
  }
}

/**
 * Retorna configuração completa para Nodemailer
 */
export async function getNodemailerConfig() {
  const smtp = await getEmailSMTPConfig();
  const branding = await getEmailBranding();
  
  // A senha vem da variável de ambiente por segurança
  const password = process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD;
  
  return {
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: password,
    },
    from: `${smtp.name} <${smtp.user}>`,
    replyTo: smtp.replyTo,
    logo: branding.logo,
  };
}

