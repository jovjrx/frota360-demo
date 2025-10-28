import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar estado com persistência no localStorage
 * Sincroniza automaticamente entre abas/janelas
 * 
 * @param key - Chave do localStorage
 * @param initialValue - Valor inicial se não houver nada no localStorage
 * 
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 * const [filters, setFilters] = useLocalStorage('table-filters', { status: 'all' });
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao ler localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Função para atualizar o valor
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Permitir valor ser uma função (como useState)
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Erro ao salvar no localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Sincronizar entre abas/janelas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Erro ao sincronizar localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue] as const;
}

/**
 * Hook para gerenciar preferências do usuário no localStorage
 * Fornece interface tipada para preferências comuns
 * 
 * @example
 * const preferences = useUserPreferences();
 * 
 * preferences.setTablePageSize(50);
 * preferences.setTheme('dark');
 */
export function useUserPreferences() {
  const [prefs, setPrefs] = useLocalStorage('user-preferences', {
    tablePageSize: 10,
    theme: 'light' as 'light' | 'dark',
    language: 'pt-PT',
    autoRefresh: false,
    refreshInterval: 30000,
  });

  return {
    ...prefs,
    setTablePageSize: (size: number) => setPrefs({ ...prefs, tablePageSize: size }),
    setTheme: (theme: 'light' | 'dark') => setPrefs({ ...prefs, theme }),
    setLanguage: (language: string) => setPrefs({ ...prefs, language }),
    setAutoRefresh: (enabled: boolean) => setPrefs({ ...prefs, autoRefresh: enabled }),
    setRefreshInterval: (interval: number) => setPrefs({ ...prefs, refreshInterval: interval }),
  };
}


