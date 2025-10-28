export type RawTranslator = ((key: string, variables?: Record<string, any>) => string) | undefined;

export type SafeTranslator = (
  key: string,
  fallbackOrVariables?: string | Record<string, any>,
  maybeVariables?: Record<string, any>
) => string;

const applyVariables = (value: string, variables?: Record<string, any>) => {
  if (!variables) {
    return value;
  }

  return Object.entries(variables).reduce((acc, [varKey, varValue]) => {
    return acc.replace(new RegExp(`{{\\s*${varKey}\\s*}}`, 'g'), String(varValue));
  }, value);
};

/**
 * Wraps a translation function and ensures we always return a safe string.
 * Supports both `(key, variables)` and `(key, fallback, variables?)` call signatures.
 */
export function createSafeTranslator(translator?: RawTranslator): SafeTranslator {
  return (key, fallbackOrVariables, maybeVariables) => {
    const fallback = typeof fallbackOrVariables === 'string' ? fallbackOrVariables : undefined;
    const variables =
      typeof fallbackOrVariables === 'object' && fallbackOrVariables !== null
        ? fallbackOrVariables
        : maybeVariables;

    let translated: unknown;

    if (translator) {
      translated = translator(key, variables);
    }

    const translatedString = typeof translated === 'string' ? translated : undefined;

    if (!translatedString || translatedString === key) {
      const fallbackValue = fallback ?? key;
      return applyVariables(String(fallbackValue), variables);
    }

    return applyVariables(translatedString, variables);
  };
}

