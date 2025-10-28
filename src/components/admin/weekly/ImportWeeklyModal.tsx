import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Input,
  Text,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { FiUpload, FiCheck, FiX } from 'react-icons/fi';
import { useState, useRef } from 'react';

interface ImportWeeklyModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekId: string;
  onImportSuccess: () => void;
  translations?: any;
}

const ALLOWED_EXTENSIONS = ['.xlsx', '.csv'];
const PLATFORMS = ['uber', 'bolt', 'myprio', 'viaverde'];

export default function ImportWeeklyModal({
  isOpen,
  onClose,
  weekId,
  onImportSuccess,
  translations,
}: ImportWeeklyModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations?.page || translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return typeof value === 'string' ? value : key;
  };

  const validateFile = (file: File): string[] => {
    const validationErrors: string[] = [];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      validationErrors.push(
        t('admin.weekly.import.invalidFormat') || `Formato inválido. Use ${ALLOWED_EXTENSIONS.join(' ou ')}`
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      validationErrors.push(
        t('admin.weekly.import.fileTooLarge') || 'Arquivo muito grande (máx: 10MB)'
      );
    }

    const nameLower = file.name.toLowerCase();
    const hasPlatform = PLATFORMS.some(p => nameLower.includes(p));
    if (!hasPlatform) {
      validationErrors.push(
        t('admin.weekly.import.noPlatformName') ||
        `Nome deve conter plataforma: ${PLATFORMS.join(', ')}`
      );
    }

    return validationErrors;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationErrors = validateFile(file);
    setErrors(validationErrors);
    setSelectedFile(validationErrors.length === 0 ? file : null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('weekId', weekId);

      const response = await fetch('/api/admin/weekly/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao importar arquivo');
      }

      toast({
        title: t('admin.weekly.import.success') || 'Arquivo importado com sucesso',
        status: 'success',
      });

      setSelectedFile(null);
      setErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onImportSuccess();
      onClose();
    } catch (err) {
      toast({
        title: t('admin.weekly.import.error') || 'Erro ao importar',
        description: (err as Error).message,
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('admin.weekly.import.title') || 'Importar Dados da Semana'}</ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              {t('admin.weekly.import.description') ||
                'Selecione um arquivo CSV ou XLSX com dados de uma das plataformas (Uber, Bolt, MyPrio, ViaVerde)'}
            </Text>

            <Badge colorScheme="blue">
              {t('admin.weekly.import.week') || 'Semana'}: {weekId}
            </Badge>

            {errors.length > 0 && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <AlertTitle>{t('admin.weekly.import.validationError') || 'Erros de validação'}</AlertTitle>
                  <AlertDescription>
                    {errors.map((err, i) => (
                      <div key={i}>
                        <Icon as={FiX} color="red.500" mr={1} />
                        {err}
                      </div>
                    ))}
                  </AlertDescription>
                </VStack>
              </Alert>
            )}

            <VStack
              spacing={3}
              p={6}
              borderWidth="2px"
              borderStyle="dashed"
              borderColor="blue.300"
              borderRadius="md"
              bg="blue.50"
              align="center"
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
              _hover={{ bg: 'blue.100' }}
            >
              <Icon as={FiUpload} boxSize={8} color="blue.600" />
              <VStack spacing={1} align="center">
                <Text fontWeight="bold" color="blue.700">
                  {selectedFile
                    ? selectedFile.name
                    : (t('admin.weekly.import.dropHere') || 'Clique ou arraste arquivo aqui')}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {t('admin.weekly.import.formats') || 'CSV ou XLSX'}
                </Text>
              </VStack>
            </VStack>

            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              display="none"
            />

            {selectedFile && errors.length === 0 && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <AlertTitle>{t('admin.weekly.import.fileReady') || 'Arquivo pronto'}</AlertTitle>
                  <AlertDescription>
                    <Icon as={FiCheck} color="green.500" mr={1} />
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </AlertDescription>
                </VStack>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              variant="ghost"
              onClick={onClose}
              isDisabled={isLoading}
            >
              {t('admin.weekly.import.cancel') || 'Cancelar'}
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUpload}
              isDisabled={!selectedFile || errors.length > 0}
              isLoading={isLoading}
              leftIcon={<Icon as={FiUpload} />}
            >
              {isLoading ? (
                <HStack spacing={2}>
                  <Spinner size="sm" />
                  <Text>{t('admin.weekly.import.uploading') || 'Importando...'}</Text>
                </HStack>
              ) : (
                (t('admin.weekly.import.upload') || 'Importar')
              )}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
