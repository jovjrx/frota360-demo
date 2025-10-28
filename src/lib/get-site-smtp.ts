// Server-side helper para buscar SMTP config
// Importa diretamente do lib/site-settings.ts sem passar pelo provider React
export async function getSiteSMTPConfig() {
  const { getSiteSMTP } = await import('./site-settings');
  return getSiteSMTP();
}

export async function getSiteContactInfo() {
  const { getSiteContact } = await import('./site-settings');
  return getSiteContact();
}

