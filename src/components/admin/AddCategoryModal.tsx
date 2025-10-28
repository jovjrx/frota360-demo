import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  VStack,
  Textarea,
  FormErrorMessage,
} from '@chakra-ui/react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    description: string;
    type: 'company' | 'affiliate' | 'renter';
  }) => Promise<void>;
  t: (key: string, fallback: string) => string;
}

export default function AddCategoryModal({
  isOpen,
  onClose,
  onAdd,
  t,
}: AddCategoryModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'company' | 'affiliate' | 'renter'>('company');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = t('categories.validation.name', 'Nome é obrigatório');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await onAdd({
        name,
        description,
        type,
      });
      setName('');
      setDescription('');
      setType('company');
      setErrors({});
      onClose();
      toast({
        title: t('categories.add.success', 'Categoria adicionada'),
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: t('categories.add.error', 'Erro ao adicionar categoria'),
        description: error?.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('categories.add.title', 'Adicionar Categoria de Documento')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isInvalid={!!errors.name} isRequired>
              <FormLabel>{t('categories.form.name', 'Nome da Categoria')}</FormLabel>
              <Input
                placeholder={t('categories.form.namePlaceholder', 'Ex: Documentos de Identificação')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors({ ...errors, name: '' });
                  }
                }}
              />
              {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{t('categories.form.type', 'Tipo')}</FormLabel>
              <Select value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="company">{t('categories.type.company', 'Empresa')}</option>
                <option value="affiliate">{t('categories.type.affiliate', 'Afiliado')}</option>
                <option value="renter">{t('categories.type.renter', 'Locatário')}</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{t('categories.form.description', 'Descrição')}</FormLabel>
              <Textarea
                placeholder={t('categories.form.descriptionPlaceholder', 'Ex: Documentos necessários para identificação')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {t('common.add', 'Adicionar')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
