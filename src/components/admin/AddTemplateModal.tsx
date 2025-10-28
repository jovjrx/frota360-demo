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
  Box,
  Text,
  Icon,
} from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    file: File;
    name: string;
    category: string;
    type: 'affiliate' | 'renter';
  }) => Promise<void>;
  t: (key: string, fallback: string) => string;
}

export default function AddTemplateModal({
  isOpen,
  onClose,
  onAdd,
  t,
}: AddTemplateModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'affiliate' | 'renter'>('affiliate');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
        toast({
          title: t('templates.fileType.error', 'Tipo de arquivo inválido'),
          description: t('templates.fileType.desc', 'Use PDF ou DOCX'),
          status: 'error',
          duration: 3000,
        });
        return;
      }
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async () => {
    if (!file || !name) {
      toast({
        title: t('templates.validation.error', 'Preencha todos os campos'),
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await onAdd({
        file,
        name,
        category: '',
        type,
      });
      setFile(null);
      setName('');
      setCategory('');
      setType('affiliate');
      onClose();
      toast({
        title: t('templates.add.success', 'Modelo adicionado'),
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: t('templates.add.error', 'Erro ao adicionar modelo'),
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
        <ModalHeader>{t('templates.add.title', 'Adicionar Modelo de Contrato')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>{t('templates.form.type', 'Tipo de Motorista')}</FormLabel>
              <Select value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="affiliate">{t('templates.type.affiliate', 'Afiliado')}</option>
                <option value="renter">{t('templates.type.renter', 'Locatário')}</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{t('templates.form.name', 'Nome do Modelo')}</FormLabel>
              <Input
                placeholder={t('templates.form.namePlaceholder', 'Ex: Contrato Afiliado v1.0')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{t('templates.form.file', 'Arquivo (PDF ou DOCX)')}</FormLabel>
              <Box
                borderWidth={2}
                borderStyle="dashed"
                borderColor="blue.300"
                p={6}
                borderRadius="md"
                textAlign="center"
                cursor="pointer"
                _hover={{ bg: 'blue.50' }}
              >
                <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <Icon as={FiUpload} fontSize="2xl" color="blue.500" mb={2} />
                  <Text fontWeight="semibold" color="blue.600">
                    {file ? file.name : t('templates.form.filePlaceholder', 'Clique para selecionar ou arraste')}
                  </Text>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    display="none"
                    style={{ display: 'none' }}
                  />
                </label>
              </Box>
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
