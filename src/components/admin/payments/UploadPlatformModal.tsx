import React, { useRef, useState } from 'react';
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
  Text,
  Input,
  useToast,
  Icon,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';

interface UploadPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'uber' | 'bolt' | 'myprio' | 'viaverde';
  weekId: string;
  weekStart: string;
  weekEnd: string;
  onUploaded: () => void;
}

export default function UploadPlatformModal({
  isOpen,
  onClose,
  platform,
  weekId,
  weekStart,
  weekEnd,
  onUploaded,
}: UploadPlatformModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) { setFile(null); return; }
    const name = f.name.toLowerCase();
    const allowed = name.endsWith('.csv') || name.endsWith('.xlsx');
    if (!allowed) {
      toast({ title: 'Formato inválido', description: 'Apenas .csv ou .xlsx', status: 'warning' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('platform', platform);
      formData.append('weekId', weekId);
      formData.append('weekStart', weekStart);
      formData.append('weekEnd', weekEnd);

      // Single-platform upload endpoint that validates headers per platform and stores rawFileArchive
      const res = await fetch('/api/admin/imports/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Falha ao enviar arquivo (valide colunas obrigatórias)');
      }

      const payload = await res.json().catch(() => ({ message: 'OK', warnings: [] }));
      const warnings: string[] = Array.isArray(payload?.warnings) ? payload.warnings : [];
      const createdPreview: string[] = Array.isArray(payload?.createdIdsPreview) ? payload.createdIdsPreview : [];

      toast({
        title: 'Arquivo importado',
        description: `${platform.toUpperCase()} • ${payload?.dataWeekly ?? 0} reg. • ${createdPreview[0] || ''}`.trim(),
        status: warnings.length > 0 ? 'warning' : 'success',
        duration: 6000,
        isClosable: true,
      });

      if (warnings.length > 0) {
        const details = warnings.slice(0, 5).join('\n');
        toast({
          title: 'Atenção: itens não mapeados',
          description: `${warnings.length} ocorrências. Ex.:\n${details}`,
          status: 'warning',
          duration: 8000,
          isClosable: true,
        });
      }
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploaded();
      onClose();
    } catch (e: any) {
      toast({ title: 'Erro no upload', description: e?.message || 'Tente novamente', status: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Importar {platform.toUpperCase()}</ModalHeader>
        <ModalCloseButton isDisabled={isUploading} />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <HStack>
              <Badge colorScheme="blue">Semana: {weekId}</Badge>
              <Text color="gray.600">{weekStart} - {weekEnd}</Text>
            </HStack>
            <VStack spacing={2} align="stretch">
              <Button leftIcon={<Icon as={FiUpload} />} onClick={() => fileInputRef.current?.click()} variant="outline">
                Selecionar arquivo (.csv ou .xlsx)
              </Button>
              <Input ref={fileInputRef} type="file" onChange={handleFileChange} accept=".csv,.xlsx" hidden />
              <Text fontSize="sm" color="gray.500">{file ? file.name : 'Nenhum arquivo selecionado'}</Text>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button onClick={onClose} variant="ghost" isDisabled={isUploading}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleUpload} isDisabled={!file} isLoading={isUploading} leftIcon={isUploading ? undefined : <Icon as={FiUpload} />}>
              {isUploading ? <Spinner size="sm" /> : 'Importar'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
