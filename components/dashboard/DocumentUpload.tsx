import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Input,
  Button,
  Card,
  FormControl,
  FormLabel,
  useToast,
  Progress,
  Icon,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { FiUpload, FiFile, FiCheck, FiX } from 'react-icons/fi';

interface DocumentUploadProps {
  onUpload: (file: File, docType: string) => Promise<void>;
  uploading?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'CNH', label: 'CNH - Carteira Nacional de Habilitação' },
  { value: 'Certificado TVDE', label: 'Certificado TVDE' },
  { value: 'Seguro', label: 'Seguro do Veículo' },
  { value: 'Comprovante Residencia', label: 'Comprovante de Residência' },
  { value: 'Criminal', label: 'Certidão Criminal' },
];

export function DocumentUpload({ onUpload, uploading = false }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('CNH');
  const [dragActive, setDragActive] = useState(false);
  const toast = useToast();

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: 'Tipo de arquivo não suportado',
        description: 'Apenas imagens (JPG, PNG) e PDF são aceitos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      await onUpload(file, docType);
      setFile(null);
      setDocType('CNH');
      toast({
        title: 'Documento enviado',
        description: 'Seu documento foi enviado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Ocorreu um erro ao enviar o documento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Card p={6} borderRadius="xl" border="1px" borderColor="gray.200">
      <VStack spacing={6} align="stretch">
        <VStack spacing={2} align="start">
          <Text fontSize="lg" fontWeight="semibold" color="gray.900">
            Enviar Documento
          </Text>
          <Text fontSize="sm" color="gray.600">
            Faça upload dos seus documentos para completar seu perfil
          </Text>
        </VStack>

        <FormControl>
          <FormLabel>Tipo de Documento</FormLabel>
          <Select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            placeholder="Selecione o tipo de documento"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </FormControl>

        <Box
          border="2px dashed"
          borderColor={dragActive ? 'green.300' : 'gray.300'}
          borderRadius="lg"
          p={8}
          textAlign="center"
          bg={dragActive ? 'green.50' : 'gray.50'}
          transition="all 0.2s"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <VStack spacing={4}>
            <Icon as={FiUpload} boxSize={8} color="gray.400" />
            <VStack spacing={2}>
              <Text fontWeight="medium" color="gray.700">
                {file ? 'Arquivo selecionado' : 'Arraste e solte seu arquivo aqui'}
              </Text>
              <Text fontSize="sm" color="gray.500">
                ou clique para selecionar
              </Text>
            </VStack>
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              display="none"
              id="file-upload"
            />
            <Button
              as="label"
              htmlFor="file-upload"
              variant="outline"
              leftIcon={<FiFile />}
              cursor="pointer"
            >
              Selecionar Arquivo
            </Button>
          </VStack>
        </Box>

        {file && (
          <Box p={4} bg="green.50" borderRadius="lg" border="1px" borderColor="green.200">
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <Icon as={FiFile} color="green.500" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium" color="green.800">
                    {file.name}
                  </Text>
                  <Text fontSize="sm" color="green.600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </VStack>
              </HStack>
              <IconButton
                icon={<FiX />}
                size="sm"
                variant="ghost"
                color="green.600"
                onClick={() => setFile(null)}
                aria-label="Remover arquivo"
              />
            </HStack>
          </Box>
        )}

        <Button
          colorScheme="green"
          onClick={handleUpload}
          isDisabled={!file || uploading}
          isLoading={uploading}
          loadingText="Enviando..."
          leftIcon={<FiUpload />}
        >
          Enviar Documento
        </Button>

        <Box>
          <Text fontSize="xs" color="gray.500">
            Formatos aceitos: JPG, PNG, PDF (máx. 10MB)
          </Text>
        </Box>
      </VStack>
    </Card>
  );
}
