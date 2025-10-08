export type RawTranslator = ((key: string, variables?: Record<string, any>) => string) | undefined;

export type SafeTranslator = (
  key: string,
  fallbackOrVariables?: string | Record<string, any>,
  maybeVariables?: Record<string, any>
) => string;

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

    if (!translator) {
      return fallback ?? key;
    }

    const value = translator(key, variables);
    if (!value || value === key) {
      return fallback ?? key;
    }

    return value;
  };
}
