import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Input,
  useToast,
  Icon,
  Box,
  HStack,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { FiUpload, FiFile } from 'react-icons/fi';
import { useState, useRef } from 'react';

interface FinancingProofUploadProps {
  isOpen: boolean;
  onClose: () => void;
  financingId: string;
  onUploadSuccess: () => void;
}

export default function FinancingProofUpload({
  isOpen,
  onClose,
  financingId,
  onUploadSuccess,
}: FinancingProofUploadProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 10MB',
          status: 'error',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Selecione um arquivo',
        status: 'warning',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('financingId', financingId);

      const response = await fetch('/api/admin/financing/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      toast({
        title: 'Comprovante enviado!',
        description: 'O comprovante foi anexado com sucesso',
        status: 'success',
      });

      setSelectedFile(null);
      onUploadSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar comprovante',
        description: error.message,
        status: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Anexar Comprovante de Pagamento</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              Faça upload do comprovante de pagamento do financiamento. 
              Formatos aceitos: PDF, imagens (JPG, PNG) ou documentos Word.
            </Text>

            <FormControl>
              <FormLabel>Arquivo do Comprovante</FormLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                onChange={handleFileSelect}
                display="none"
              />
              <Button
                w="full"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Icon as={FiUpload} />}
                variant="outline"
              >
                Selecionar Arquivo
              </Button>
            </FormControl>

            {selectedFile && (
              <Box 
                p={3} 
                borderWidth="1px" 
                borderRadius="md" 
                bg="green.50"
                borderColor="green.200"
              >
                <HStack>
                  <Icon as={FiFile} color="green.600" />
                  <VStack align="start" spacing={0} flex="1">
                    <Text fontSize="sm" fontWeight="medium">
                      {selectedFile.name}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleUpload}
            isLoading={uploading}
            isDisabled={!selectedFile}
          >
            Enviar Comprovante
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

