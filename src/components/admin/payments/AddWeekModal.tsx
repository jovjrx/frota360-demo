import { useState, useMemo } from 'react';
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
  VStack,
  HStack,
  Checkbox,
  useToast,
  Text,
} from '@chakra-ui/react';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import type { IntegrationPlatform } from '@/schemas/integration';

interface AddWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tCommon?: any;
  tPage?: any;
  availableIntegrations?: IntegrationPlatform[];
}

export default function AddWeekModal({
  isOpen,
  onClose,
  onSuccess,
  tCommon,
  tPage,
  availableIntegrations = ['uber', 'bolt', 'myprio', 'viaverde'],
}: AddWeekModalProps) {
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);
  const toast = useToast();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIntegrations, setSelectedIntegrations] = useState<IntegrationPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleIntegrationChange = (platform: IntegrationPlatform, checked: boolean) => {
    if (checked) {
      setSelectedIntegrations([...selectedIntegrations, platform]);
    } else {
      setSelectedIntegrations(selectedIntegrations.filter(p => p !== platform));
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      toast({
        title: t('validation.required') || 'Campos obrigatórios',
        status: 'warning',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/weekly/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          integrations: selectedIntegrations,
        }),
      });

      if (!response.ok) throw new Error('Failed to create week');

      toast({
        title: t('weekly.weekCreatedSuccessfully') || 'Semana criada com sucesso',
        status: 'success',
      });

      setStartDate('');
      setEndDate('');
      setSelectedIntegrations([]);
      onClose();
      onSuccess?.();
    } catch (error) {
      toast({
        title: t('weekly.weekCreationError') || 'Erro ao criar semana',
        description: (error as Error).message,
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('weekly.import.period') || 'Adicionar Semana'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>{t('weekly.import.startDate') || 'Data de Início'}</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{t('weekly.import.endDate') || 'Data de Fim'}</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>{t('integration.select') || 'Integrações'}</FormLabel>
              <VStack align="start" spacing={2}>
                {availableIntegrations.map((platform) => (
                  <Checkbox
                    key={platform}
                    isChecked={selectedIntegrations.includes(platform)}
                    onChange={(e) =>
                      handleIntegrationChange(platform, e.target.checked)
                    }
                  >
                    <Text textTransform="uppercase">{platform}</Text>
                  </Checkbox>
                ))}
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              {tc('actions.cancel', 'Cancelar')}
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading}>
              {tc('actions.create', 'Criar')}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
