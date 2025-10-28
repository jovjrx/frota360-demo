// Tipos para configurações dinâmicas do site

export interface SiteBranding {
  logo: string; // URL do logo
  favicon: string; // URL do favicon
  appleTouchIcon: string; // URL do apple touch icon
}

export interface SiteColors {
  primary: string; // Cor principal (ex: "#228B22")
  secondary: string; // Cor secundária
  // Opcionalmente, paleta completa do Chakra
  brand?: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  author: string;
  siteName: string;
  siteUrl: string;
  defaultOgImage: string;
  // Informações de contato (manterá compatibilidade com existente)
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterHandle?: string;
}

export interface SEOMultiLang {
  pt: SEOConfig;
  en: SEOConfig;
  [locale: string]: SEOConfig; // Permite adicionar outras línguas dinamicamente
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  nipc?: string; // NIPC/NIF da empresa
  // Social
  facebookUrl: string;
  instagramUrl: string;
  twitterHandle: string;
  // Textos do footer
  tagline?: string;
  description?: string;
  copyright?: string;
  developerBy?: string;
  developer?: string;
  developerWebsite?: string;
}

export interface SMTPConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean; // true para 465, false para outras portas
  user: string; // Email que dispara (from)
  name: string; // Nome do remetente (ex: "Conduz.pt")
  replyTo: string; // Email para reply
}

export interface TrackingConfig {
  googleAnalyticsId: string;
  googleTagManagerId: string;
  facebookPixelId: string;
  metaAccessToken?: string;
  tiktokPixelId?: string;
  tiktokAccessToken?: string;
  microsoftClarityId?: string;
  hotjarSiteId?: string;
  vercelAnalyticsEnabled: boolean;
  vercelSpeedInsightsEnabled: boolean;
}

export interface SiteSettings {
  id: string; // Sempre "global" ou similar
  branding: SiteBranding;
  colors: SiteColors;
  contact: ContactInfo; // Informações de contato globais (mesmas para todas línguas)
  smtp: SMTPConfig; // Configuração SMTP para envio de emails
  seo: SEOMultiLang;
  tracking: TrackingConfig;
  updatedAt: string;
  updatedBy: string;
}

// Valores padrão
export const DEFAULT_SITE_SETTINGS: Omit<SiteSettings, 'id' | 'updatedAt' | 'updatedBy'> = {
  branding: {
    logo: '/img/logo.png',
    favicon: '/img/icone.png',
    appleTouchIcon: '/img/icone.png',
  },
  colors: {
    primary: 'blue.500',
    secondary: 'blue.700',
    brand: {
      50: '#F3E8FF',
      100: '#E9D5FF',
      200: '#D8B4FE',
      300: '#C084FC',
      400: '#A855F7',
      500: '#9333EA',
      600: '#7E22CE',
      700: '#6B21A8',
      800: '#581C87',
      900: '#4C1D95',
    },
  },
  contact: {
    email: 'demo@frota360.pt',
    phone: '+351 900 000 000',
    address: 'Av. da Liberdade 123, 3º Andar',
    city: 'Lisboa',
    postalCode: '1000-000',
    country: 'Portugal',
    nipc: '999999999',
    facebookUrl: 'https://www.facebook.com/frota360pt',
    instagramUrl: 'https://www.instagram.com/frota360pt',
    twitterHandle: '@frota360',
    tagline: 'Sua Frota, merece uma gestão 360°.',
    description: 'A plataforma que transforma motoristas em empresários de sucesso',
    copyright: 'Todos os direitos reservados',
    developerBy: 'Desenvolvido por',
    developer: 'Alvorada Magistral',
    developerWebsite: 'alvoradamagistral.eu',
  },
  smtp: {
    enabled: true,
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: process.env.EMAIL_USER || 'demo@frota360.pt',
    name: 'Frota360.pt',
    replyTo: process.env.EMAIL_REPLY_TO || 'demo@frota360.pt',
  },
  seo: {
    pt: {
      title: 'Frota360 - Gestão 360° para TVDE',
      description: 'Gestão 360° para motoristas TVDE em Portugal',
      keywords: 'TVDE Portugal, motorista TVDE, Uber Portugal, Bolt Portugal',
      author: 'Frota360',
      siteName: 'Frota360.pt',
      siteUrl: 'https://frota360.pt',
      defaultOgImage: 'https://frota360.pt/img/icone.png',
    },
    en: {
      title: 'Frota360 - 360° Management for TVDE',
      description: '360° Management for TVDE drivers in Portugal',
      keywords: 'TVDE Portugal, TVDE driver, Uber Portugal, Bolt Portugal',
      author: 'Frota360',
      siteName: 'Frota360.pt',
      siteUrl: 'https://frota360.pt',
      defaultOgImage: 'https://frota360.pt/img/icone.png',
    },
  },
  tracking: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || 'G-6YFDWZFGV7',
    googleTagManagerId: '',
    facebookPixelId: '',
    metaAccessToken: '',
    tiktokPixelId: '',
    tiktokAccessToken: '',
    microsoftClarityId: '',
    hotjarSiteId: '',
    vercelAnalyticsEnabled: true,
    vercelSpeedInsightsEnabled: true,
  },
};

