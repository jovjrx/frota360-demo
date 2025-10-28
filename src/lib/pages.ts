import NodeCache from 'node-cache';

interface PageConfig {
  blocks: any[];
}

// Cache com node-cache (TTL de 5 minutos)
const pagesCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Configurações locais - SEM Firebase
import homeConfig from '@/demo/pages/home.json';
import aboutConfig from '@/demo/pages/about.json';
import driversConfig from '@/demo/pages/drivers.json';

const pageConfigs: { [key: string]: PageConfig } = {
  home: homeConfig as PageConfig,
  about: aboutConfig as PageConfig,
  drivers: driversConfig as PageConfig,
};

/**
 * Busca configuração de página dos JSON locais (SEM Firebase)
 */
export async function getPageConfig(slug: string): Promise<PageConfig> {
  // Verifica cache primeiro
  const cached = pagesCache.get<PageConfig>(slug);
  if (cached) {
    return cached;
  }

  // Busca da configuração local
  if (pageConfigs[slug]) {
    console.log(`Carregando página local: ${slug}`);
    // Cacheia a configuração
    pagesCache.set(slug, pageConfigs[slug]);
    return pageConfigs[slug];
  }

  // Se não encontrou, retorna array vazio
  console.warn(`Página ${slug} não encontrada`);
  return { blocks: [] };
}

/**
 * Invalida cache de uma página
 */
export function invalidatePageCache(slug: string) {
  pagesCache.del(slug);
}

/**
 * Invalida todo o cache de páginas
 */
export function invalidateAllPagesCache() {
  pagesCache.flushAll();
}

