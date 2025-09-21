import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
} from '@chakra-ui/react';
import { FiSave, FiTrash2, FiX } from 'react-icons/fi';

interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  onDelete?: () => void;
  saveText?: string;
  deleteText?: string;
  isLoading?: boolean;
  isDeleting?: boolean;
  showDelete?: boolean;
  showSave?: boolean;
  size?: string;
  error?: string;
}

export default function StandardModal({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  onDelete,
  saveText = 'Salvar',
  deleteText = 'Excluir',
  isLoading = false,
  isDeleting = false,
  showDelete = false,
  showSave = true,
  size = 'lg',
  error,
}: StandardModalProps) {
  const toast = useToast();

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave();
        toast({
          title: 'Sucesso!',
          description: 'Operação realizada com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      }
    } catch (error: any) {
      toast({
        title: 'Erro!',
        description: error.message || 'Ocorreu um erro ao salvar.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (onDelete) {
        await onDelete();
        toast({
          title: 'Sucesso!',
          description: 'Item excluído com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      }
    } catch (error: any) {
      toast({
        title: 'Erro!',
        description: error.message || 'Ocorreu um erro ao excluir.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent mx={4} maxW="90vw">
        <ModalHeader fontSize="lg" fontWeight="bold" pb={2}>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {error && (
              <Alert status="error">
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {children}
          </VStack>
        </ModalBody>
        <ModalFooter pt={0}>
          <HStack spacing={2}>
            <Button variant="outline" onClick={onClose} leftIcon={<FiX />}>
              Cancelar
            </Button>
            {showDelete && (
              <Button
                colorScheme="red"
                variant="outline"
                onClick={handleDelete}
                isLoading={isDeleting}
                leftIcon={<FiTrash2 />}
              >
                {deleteText}
              </Button>
            )}
            {showSave && (
              <Button
                colorScheme="blue"
                onClick={handleSave}
                isLoading={isLoading}
                leftIcon={<FiSave />}
              >
                {saveText}
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
