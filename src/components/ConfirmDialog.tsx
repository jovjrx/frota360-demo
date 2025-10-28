import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Icon,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColorScheme?: 'red' | 'blue' | 'green' | 'orange';
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

/**
 * Componente de diálogo de confirmação reutilizável
 * Suporta diferentes variantes visuais e ações assíncronas
 * 
 * @example
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={async () => {
 *     await deleteDriver(id);
 *     setIsOpen(false);
 *   }}
 *   title="Excluir Motorista"
 *   message="Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita."
 *   variant="danger"
 * />
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColorScheme,
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  // Definir ícone e cor baseado na variante
  const variantConfig = {
    danger: {
      icon: FiAlertTriangle,
      color: 'red.500',
      colorScheme: 'red',
    },
    warning: {
      icon: FiAlertTriangle,
      color: 'orange.500',
      colorScheme: 'orange',
    },
    info: {
      icon: FiInfo,
      color: 'blue.500',
      colorScheme: 'blue',
    },
    success: {
      icon: FiCheckCircle,
      color: 'green.500',
      colorScheme: 'green',
    },
  };

  const config = variantConfig[variant];
  const finalColorScheme = confirmColorScheme || config.colorScheme;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Erro ao confirmar ação:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Icon as={config.icon} boxSize={6} color={config.color} />
            <Text>{title}</Text>
          </VStack>
        </ModalHeader>

        <ModalBody>
          <Text color="gray.600">{message}</Text>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button
            variant="ghost"
            onClick={onClose}
            isDisabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            colorScheme={finalColorScheme}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}


