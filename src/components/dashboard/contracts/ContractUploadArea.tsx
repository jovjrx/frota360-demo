import { useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Card,
  CardBody,
  VStack,
  Text,
  Button,
  HStack,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { FiUploadCloud, FiFileText } from 'react-icons/fi';

export interface ContractUploadAreaHandle {
  openSelector: () => void;
}

interface ContractUploadAreaProps {
  onFileSelected: (file: File) => void;
  isUploading?: boolean;
  lastFileName?: string | null;
  submittedAt?: string | null;
}

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ContractUploadArea = forwardRef<ContractUploadAreaHandle, ContractUploadAreaProps>(
  ({ onFileSelected, isUploading = false, lastFileName, submittedAt }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleChooseFile = () => {
      inputRef.current?.click();
    };

    useImperativeHandle(ref, () => ({
      openSelector: handleChooseFile,
    }));

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (file.type !== 'application/pdf') {
        alert('Envie um arquivo PDF.');
        event.target.value = '';
        return;
      }

      onFileSelected(file);
      event.target.value = '';
    };

    return (
      <Card variant="outline">
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <VStack align="start" spacing={1}>
              <HStack spacing={2}>
                <Icon as={FiUploadCloud} boxSize={5} color="green.500" />
                <Text fontWeight="semibold">Envio rápido</Text>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Faça upload do contrato assinado em formato PDF com até 10MB.
              </Text>
            </VStack>

            <Button leftIcon={<FiUploadCloud />} colorScheme="green" onClick={handleChooseFile} isLoading={isUploading}>
              Selecionar PDF
            </Button>
            <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={handleFileChange} />

            {(lastFileName || submittedAt) && (
              <VStack align="start" spacing={1} bg="gray.50" borderRadius="md" p={3}>
                {lastFileName && (
                  <HStack spacing={2} color="gray.700">
                    <Icon as={FiFileText} />
                    <Text fontSize="sm">
                      Último arquivo: <strong>{lastFileName}</strong>
                    </Text>
                  </HStack>
                )}
                {submittedAt && (
                  <Badge alignSelf="flex-start" colorScheme="blue">
                    Enviado em {formatDateTime(submittedAt)}
                  </Badge>
                )}
              </VStack>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  }
);

ContractUploadArea.displayName = 'ContractUploadArea';

