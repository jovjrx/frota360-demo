import { useState, FormEvent, ChangeEvent } from 'react';
import {
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Select,
  Input,
  Button,
  Alert,
  AlertIcon,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { FiUploadCloud } from 'react-icons/fi';

interface ContractTemplateUploadProps {
  onUploaded?: (templateId: string) => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type TemplateType = 'affiliate' | 'renter';

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Invalid file result'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export function ContractTemplateUpload({ onUploaded }: ContractTemplateUploadProps) {
  const toast = useToast();
  const [type, setType] = useState<TemplateType>('affiliate');
  const [version, setVersion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setError('Apenas arquivos PDF são permitidos.');
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError('O arquivo excede o limite de 10MB.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError('Selecione um arquivo PDF para continuar.');
      return;
    }

    if (!version.trim()) {
      setError('Informe a versão do documento.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const base64 = await readFileAsBase64(file);
      const response = await fetch('/api/admin/contracts/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          version: version.trim(),
          fileName: file.name,
          fileContent: base64,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message = data?.error ?? 'Erro ao enviar o modelo.';
        throw new Error(message);
      }

      toast({
        title: 'Modelo enviado com sucesso!',
        status: 'success',
        duration: 3000,
      });

      setFile(null);
      setVersion('');
      onUploaded?.(data.id);
    } catch (uploadError: any) {
      console.error('[Contracts] Failed to upload template:', uploadError);
      setError(uploadError?.message ?? 'Erro ao enviar o modelo.');
      toast({
        title: 'Erro ao enviar modelo',
        description: uploadError?.message ?? 'Tente novamente mais tarde.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card as="form" onSubmit={handleSubmit} variant="outline">
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <HStack spacing={3}>
            <Icon as={FiUploadCloud} boxSize={6} color="blue.500" />
            <VStack align="start" spacing={0}>
              <Heading size="sm">Upload de modelo</Heading>
              <Text fontSize="sm" color="gray.600">
                Envie um novo contrato modelo em PDF para afiliados ou locatários.
              </Text>
            </VStack>
          </HStack>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">{error}</Text>
            </Alert>
          )}

          <HStack spacing={4} align={{ base: 'stretch', md: 'center' }} flexWrap="wrap">
            <FormControl maxW={{ base: '100%', md: '200px' }}>
              <FormLabel>Tipo de contrato</FormLabel>
              <Select value={type} onChange={(event) => setType(event.target.value as TemplateType)}>
                <option value="affiliate">Afiliado</option>
                <option value="renter">Locatário</option>
              </Select>
            </FormControl>

            <FormControl maxW={{ base: '100%', md: '200px' }}>
              <FormLabel>Versão</FormLabel>
              <Input
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="Ex: 1.0"
              />
            </FormControl>

            <FormControl flex="1">
              <FormLabel>Arquivo PDF</FormLabel>
              <Input type="file" accept="application/pdf" onChange={handleFileChange} />
              {file && (
                <Text fontSize="xs" color="gray.500" mt={1} noOfLines={1}>
                  {file.name}
                </Text>
              )}
            </FormControl>
          </HStack>

          <Button type="submit" colorScheme="blue" alignSelf="flex-start" isLoading={isSubmitting}>
            Enviar modelo
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
}

