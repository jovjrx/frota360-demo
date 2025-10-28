/**
 * Resolve blocos que usam chaves de tradução (ex: "benefits.items")
 * Converta-as em objetos multilíngua baseado no locale
 */

export function resolveBlockTranslations(
  blocks: any[],
  translations: { common: any; page: any },
  locale: string = 'pt'
): any[] {
  return blocks.map(block => {
    const resolved = { ...block };
    
    // Resolve cada campo do bloco
    Object.keys(resolved).forEach(key => {
      const value = resolved[key];
      
      // Se é string com ponto (ex: "benefits.items"), é chave de tradução
      if (typeof value === 'string' && value.includes('.')) {
        const translationValue = getTranslationValue(value, translations.page, translations.common);
        if (translationValue !== null) {
          resolved[key] = translationValue;
        }
      }
      
      // Se é array, resolve recursivamente cada item
      if (Array.isArray(value)) {
        resolved[key] = value.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            return resolveItemTranslations(item, translations, locale);
          }
          // Se item é string com ponto, resolve como chave
          if (typeof item === 'string' && item.includes('.')) {
            const translationValue = getTranslationValue(item, translations.page, translations.common);
            return translationValue !== null ? translationValue : item;
          }
          return item;
        });
      }
      
      // Se NÃO é array mas é string com ponto que não foi resolvido acima (por exemplo, items: "benefits.items")
      if (typeof value === 'string' && value.includes('.') && !resolved[key]) {
        const translationValue = getTranslationValue(value, translations.page, translations.common);
        if (translationValue !== null) {
          resolved[key] = translationValue;
        }
      }
      
      // Se é objeto, resolve recursivamente
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        resolved[key] = resolveItemTranslations(value, translations, locale);
      }
    });
    
    return resolved;
  });
}

function resolveItemTranslations(item: any, translations: { common: any; page: any }, locale: string): any {
  const resolved = { ...item };
  
  Object.keys(resolved).forEach(key => {
    const value = resolved[key];
    
    // Se é string com ponto, resolve
    if (typeof value === 'string' && value.includes('.')) {
      const translationValue = getTranslationValue(value, translations.page, translations.common);
      if (translationValue !== null) {
        resolved[key] = translationValue;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Resolve recursivamente
      resolved[key] = resolveItemTranslations(value, translations, locale);
    }
  });
  
  return resolved;
}

function getTranslationValue(
  key: string,
  pageTranslations: any,
  commonTranslations: any
): any {
  const keys = key.split('.');
  const firstKey = keys[0];
  
  let value: any = null;
  
  // Se começa com "common.", busca em common
  if (firstKey === 'common') {
    value = getNestedValue(commonTranslations, keys.slice(1));
  } else {
    // Senão, busca em pageTranslations
    value = getNestedValue(pageTranslations, keys);
  }
  
  if (value === null || value === undefined) {
    return null;
  }
  
  // Se é array, mantém como array (não cria objeto multilíngua)
  // O getArray vai lidar com isso no BlockRenderer
  if (Array.isArray(value)) {
    return value;
  }
  
  // Se é objeto complexo (não é {pt, en}), retorna como está
  if (typeof value === 'object' && !('pt' in value || 'en' in value)) {
    return value;
  }
  
  // Se é string/number/boolean, cria objeto multilíngua
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return {
      pt: value,
      en: value,
    };
  }
  
  // Se já é objeto {pt, en}, retorna
  if (typeof value === 'object' && ('pt' in value || 'en' in value)) {
    return value;
  }
  
  return null;
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

