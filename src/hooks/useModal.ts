import { useDisclosure } from '@chakra-ui/react';
import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar modais com dados associados
 * Simplifica o padrão comum de abrir modal com dados específicos
 * 
 * @example
 * const { isOpen, data, open, close } = useModal<Driver>();
 * 
 * // Abrir modal com dados
 * <Button onClick={() => open(driver)}>Ver Detalhes</Button>
 * 
 * // No modal
 * <Modal isOpen={isOpen} onClose={close}>
 *   {data && <DriverDetails driver={data} />}
 * </Modal>
 */
export function useModal<T = any>() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [data, setData] = useState<T | null>(null);

  const open = useCallback(
    (modalData?: T) => {
      if (modalData !== undefined) {
        setData(modalData);
      }
      onOpen();
    },
    [onOpen]
  );

  const close = useCallback(() => {
    onClose();
    // Limpar dados após fechar (com pequeno delay para animação)
    setTimeout(() => setData(null), 200);
  }, [onClose]);

  return {
    isOpen,
    data,
    open,
    close,
    setData, // Permite atualizar dados sem fechar/abrir
  };
}

/**
 * Hook para gerenciar múltiplos modais
 * Útil quando uma página tem vários modais diferentes
 * 
 * @example
 * const modals = useModals(['edit', 'delete', 'view']);
 * 
 * <Button onClick={() => modals.edit.open(driver)}>Editar</Button>
 * <Button onClick={() => modals.delete.open(driver)}>Excluir</Button>
 * 
 * <EditModal isOpen={modals.edit.isOpen} onClose={modals.edit.close} data={modals.edit.data} />
 */
export function useModals<T extends string>(modalNames: T[]) {
  const modals = {} as Record<T, ReturnType<typeof useModal>>;

  modalNames.forEach((name) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    modals[name] = useModal();
  });

  return modals;
}


