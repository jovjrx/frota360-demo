import { useMemo } from 'react';
import { useToast } from '@chakra-ui/react';

/**
 * Hook para gerenciar modo demo
 */

export function useDemoMode() {
  const toast = useToast();
  
  const isDemo = useMemo(() => {
    return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  }, []);
  
  const blockAction = (
    action: () => void | Promise<void>, 
    message: string = 'Ação desabilitada em modo demonstração'
  ) => {
    if (isDemo) {
      toast({
        title: 'Modo Demonstração',
        description: message,
        status: 'warning',
        duration: 3000,
        isClosable: true,
        icon: '🔒',
      });
      console.warn('Demo Mode: Action blocked', { message, action: action.toString() });
      return;
    }
    
    // Executar ação normalmente
    if (typeof action === 'function') {
      const result = action();
      if (result instanceof Promise) {
        return result;
      }
      return result;
    }
  };
  
  return {
    isDemo,
    blockAction,
    isPublicDemo: process.env.DEMO_PUBLIC_SITE === 'true',
  };
}

