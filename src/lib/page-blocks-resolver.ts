// Resolve traduções dinâmicas em blocos de página

interface BlockData {
  [key: string]: any;
}

interface TranslationData {
  [key: string]: any;
}

export function resolveBlockTranslations(
  block: BlockData,
  ptTranslations: TranslationData,
  enTranslations: TranslationData,
  commonPt?: TranslationData,
  commonEn?: TranslationData
): BlockData {
  const resolved = { ...block };

  // Resolve campos individuais
  Object.keys(resolved).forEach(key => {
    const value = resolved[key];
    
    // Se é string com ponto, tenta resolver como chave de tradução
    if (typeof value === 'string' && value.includes('.')) {
      const keys = value.split('.');
      const firstKey = keys[0];
      
      let ptValue: any;
      let enValue: any;
      
      // Verifica se é common
      if (firstKey === 'common') {
        if (commonPt && commonEn) {
          ptValue = getNestedValue(commonPt, keys.slice(1));
          enValue = getNestedValue(commonEn, keys.slice(1));
        }
      } else {
        ptValue = getNestedValue(ptTranslations, keys);
        enValue = getNestedValue(enTranslations, keys);
      }
      
      if (ptValue || enValue) {
        resolved[key] = {
          pt: ptValue || value,
          en: enValue || value
        };
      }
    }
    
    // Se é array, resolve recursivamente
    if (Array.isArray(value)) {
      resolved[key] = value.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return resolveBlockTranslations(item, ptTranslations, enTranslations, commonPt, commonEn);
        }
        return item;
      });
    }
    
    // Se é objeto, resolve recursivamente
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      resolved[key] = resolveBlockTranslations(value, ptTranslations, enTranslations, commonPt, commonEn);
    }
  });

  return resolved;
}

function getNestedValue(obj: any, keys: string[]): any {
  let value = obj;
  for (const key of keys) {
    if (!value || typeof value !== 'object') return null;
    value = value[key];
    if (value === undefined || value === null) return null;
  }
  return value;
}

// Função auxiliar para obter texto do objeto multilíngua baseado no locale
export function getText(multilang: { pt: string; en: string } | string, locale: string = 'pt'): string {
  if (typeof multilang === 'string') return multilang;
  if (typeof multilang === 'object' && multilang.pt && multilang.en) {
    return locale === 'pt' ? multilang.pt : multilang.en;
  }
  return '';
}

export function getArray(multilang: { pt: any[]; en: any[] } | any[], locale: string = 'pt'): any[] {
  if (Array.isArray(multilang)) return multilang;
  if (typeof multilang === 'object' && multilang.pt && multilang.en) {
    return locale === 'pt' ? multilang.pt : multilang.en;
  }
  return [];
}

