// lib/i18n-helpers.ts
export type TFn = (key: string) => string;
export type TArrayFn = (key: string) => string[];

export function makeT(dict: any): TFn {
  return (path: string) => {
    if (!path || typeof path !== 'string') return path || '';
    const keys = path.split(".");
    let cur: any = dict;
    for (const k of keys) {
      if (cur && typeof cur === "object" && k in cur) cur = cur[k];
      else return path;
    }
    return cur; // Retorna o valor encontrado, seja string, array, objeto, etc.
  };
}

export function makeTArray(dict: any): TArrayFn {
  return (path: string) => {
    if (!path || typeof path !== 'string') return [];
    const keys = path.split(".");
    let cur: any = dict;
    for (const k of keys) {
      if (cur && typeof cur === "object" && k in cur) cur = cur[k];
      else return [];
    }
    return Array.isArray(cur) ? cur : [];
  };
}

export const ns = (t: TFn) => (scope: string): TFn => (key: string) => t(`${scope}.${key}`);

