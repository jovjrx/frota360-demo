import { useToast, UseToastOptions } from '@chakra-ui/react';
import { useCallback } from 'react';

/**
 * Hook customizado para notificações toast padronizadas
 * Simplifica o uso de toasts e garante consistência visual
 * 
 * @example
 * const notify = useToastNotification();
 * 
 * notify.success('Operação realizada com sucesso!');
 * notify.error('Erro ao processar solicitação');
 * notify.warning('Atenção: dados incompletos');
 * notify.info('Processamento iniciado');
 */
export function useToastNotification() {
  const toast = useToast();

  const showToast = useCallback(
    (options: UseToastOptions) => {
      toast({
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        ...options,
      });
    },
    [toast]
  );

  return {
    success: useCallback(
      (title: string, description?: string) => {
        showToast({
          title,
          description,
          status: 'success',
          duration: 3000,
        });
      },
      [showToast]
    ),

    error: useCallback(
      (title: string, description?: string) => {
        showToast({
          title,
          description,
          status: 'error',
          duration: 5000,
        });
      },
      [showToast]
    ),

    warning: useCallback(
      (title: string, description?: string) => {
        showToast({
          title,
          description,
          status: 'warning',
          duration: 4000,
        });
      },
      [showToast]
    ),

    info: useCallback(
      (title: string, description?: string) => {
        showToast({
          title,
          description,
          status: 'info',
          duration: 4000,
        });
      },
      [showToast]
    ),

    loading: useCallback(
      (title: string, description?: string) => {
        return showToast({
          title,
          description,
          status: 'loading',
          duration: null,
        });
      },
      [showToast]
    ),
  };
}


