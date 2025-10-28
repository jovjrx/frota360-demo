import { useState, useCallback } from 'react';
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
  Select,
  Textarea,
  Input,
  VStack,
  HStack,
  Text,
  useToast,
  Spinner,
  Box,
  Checkbox,
} from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';
import useSWR from 'swr';
import type { DocumentCategory } from '@/schemas/document-category';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (formData: FormData) => Promise<void>;
  categories: DocumentCategory[];
  t: (key: string, fallback: string) => string;
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) =>
    res.ok ? res.json() : { data: [] }
  );

export default function AddDocumentModal({
  isOpen,
  onClose,
  onAdd,
  categories,
  t,
}: AddDocumentModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [sendToDriver, setSendToDriver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');

  // Fetch drivers
  const { data: driversData } = useSWR(
    sendToDriver ? '/api/admin/drivers/list?limit=500' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const drivers = driversData?.data || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!fileName) {
        setFileName(selectedFile.name.replace(/\.[^.]+$/, ''));
      }
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!categoryId || !file || !fileName) {
      toast({
        title: t('documents.add.validation', 'Preencha todos os campos obrigatórios'),
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (sendToDriver && !driverId) {
      toast({
        title: t('documents.add.selectDriver', 'Selecione um motorista'),
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('categoryId', categoryId);
      formData.append('documentName', fileName);
      formData.append('file', file);
      if (sendToDriver && driverId) {
        formData.append('driverId', driverId);
        formData.append('status', 'pending');
      } else {
        formData.append('status', 'approved');
      }

      await onAdd(formData);

      // Reset form
      setCategoryId('');
      setDriverId('');
      setSendToDriver(false);
      setFile(null);
      setFileName('');
      onClose();

      toast({
        title: t('documents.add.success', 'Documento adicionado com sucesso'),
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error adding document:', error);
      toast({
        title: t('documents.add.error', 'Erro ao adicionar documento'),
        description: error?.message || 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, file, fileName, sendToDriver, driverId, onAdd, t, toast, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('documents.add.title', 'Adicionar Documento')}</ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Categoria */}
            <FormControl isRequired>
              <FormLabel>{t('documents.fields.category', 'Categoria')}</FormLabel>
              <Select
                placeholder={t('documents.fields.selectCategory', 'Selecione uma categoria')}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                isDisabled={isLoading}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Nome do Documento */}
            <FormControl isRequired>
              <FormLabel>{t('documents.fields.name', 'Nome do Documento')}</FormLabel>
              <Input
                placeholder={t('documents.fields.namePlaceholder', 'Ex: Comprovante de Renda')}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                isDisabled={isLoading}
              />
            </FormControl>

            {/* Upload */}
            <FormControl isRequired>
              <FormLabel>{t('documents.fields.file', 'Arquivo')}</FormLabel>
              <Box
                borderWidth={2}
                borderStyle="dashed"
                borderColor="blue.300"
                borderRadius="md"
                p={6}
                textAlign="center"
                cursor="pointer"
                _hover={{ borderColor: 'blue.500', bg: 'blue.50' }}
                transition="all 0.2s"
              >
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={isLoading}
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                  <Icon as={FiUpload} boxSize={6} color="blue.500" mb={2} display="block" />
                  {file ? (
                    <VStack spacing={1}>
                      <Text fontWeight="bold" color="green.600">
                        {file.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </VStack>
                  ) : (
                    <VStack spacing={1}>
                      <Text fontWeight="bold">{t('documents.upload.click', 'Clique para selecionar')}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {t('documents.upload.formats', 'PDF, DOC, DOCX, JPG, PNG')}
                      </Text>
                    </VStack>
                  )}
                </label>
              </Box>
            </FormControl>

            {/* Enviar para motorista */}
            <FormControl>
              <Checkbox
                isChecked={sendToDriver}
                onChange={(e) => setSendToDriver(e.target.checked)}
                isDisabled={isLoading}
              >
                {t('documents.fields.sendToDriver', 'Enviar para motorista (pendente assinatura)')}
              </Checkbox>
            </FormControl>

            {/* Motorista (se enviar) */}
            {sendToDriver && (
              <FormControl isRequired>
                <FormLabel>{t('documents.fields.driver', 'Motorista')}</FormLabel>
                {drivers.length > 0 ? (
                  <Select
                    placeholder={t('documents.fields.selectDriver', 'Selecione um motorista')}
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    isDisabled={isLoading}
                  >
                    {drivers.map((driver: any) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <HStack>
                    <Spinner size="sm" />
                    <Text fontSize="sm" color="gray.600">
                      {t('documents.loading', 'Carregando motoristas...')}
                    </Text>
                  </HStack>
                )}
              </FormControl>
            )}

            {/* Info */}
            <Box bg="blue.50" p={3} borderRadius="md" borderLeft="4px" borderLeftColor="blue.400">
              <Text fontSize="sm" color="blue.800">
                <strong>{t('documents.info.title', 'ℹ️ Informação:')}</strong>
                {sendToDriver
                  ? t(
                      'documents.info.pending',
                      ' O documento será enviado ao motorista com status PENDENTE. Ele precisará fazer upload ou confirmar.'
                    )
                  : t(
                      'documents.info.approved',
                      ' O documento será gravado automaticamente como APROVADO.'
                    )}
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} isDisabled={isLoading} mr={3}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button
            colorScheme="orange"
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText={t('common.loading', 'Carregando...')}
          >
            {t('common.add', 'Adicionar')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
