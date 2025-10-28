import React, { useState, useMemo, useEffect } from 'react';
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
  FormErrorMessage,
  Box,
  Spinner,
  Text,
} from '@chakra-ui/react';
import type { ContractTemplate } from '@/schemas/contract-template';

interface Driver {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

interface SendContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ContractTemplate[];
  onSend: (data: {
    driverId: string;
    templateId: string;
  }) => Promise<void>;
  t: (key: string, fallback: string) => string;
}

export default function SendContractModal({
  isOpen,
  onClose,
  templates,
  onSend,
  t,
}: SendContractModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [searchDriver, setSearchDriver] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load drivers on modal open
  useEffect(() => {
    if (isOpen) {
      loadDrivers();
    }
  }, [isOpen]);

  const loadDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const response = await fetch('/api/admin/drivers/list');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.data || []);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const filteredDrivers = useMemo(() => {
    if (!searchDriver.trim()) return drivers;
    const search = searchDriver.toLowerCase();
    return drivers.filter(
      (d) =>
        d.fullName?.toLowerCase().includes(search) ||
        d.email?.toLowerCase().includes(search) ||
        d.phone?.includes(searchDriver)
    );
  }, [drivers, searchDriver]);

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!driverId) {
      newErrors.driverId = t('contracts.validation.driverId', 'Selecione um motorista');
    }
    if (!templateId) {
      newErrors.templateId = t('contracts.validation.template', 'Selecione um template');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await onSend({
        driverId,
        templateId,
      });
      setDriverId('');
      setTemplateId('');
      setSearchDriver('');
      setErrors({});
      onClose();
      toast({
        title: t('contracts.send.success', 'Solicitação enviada'),
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: t('contracts.send.error', 'Erro ao enviar solicitação'),
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
        <ModalHeader>{t('contracts.send.title', 'Nova Solicitação de Contrato')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isInvalid={!!errors.driverId} isRequired>
              <FormLabel>{t('contracts.form.driver', 'Motorista')}</FormLabel>
              {isLoadingDrivers ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <Spinner />
                </Box>
              ) : (
                <>
                  <Input
                    placeholder={t('contracts.form.searchDriver', 'Buscar motorista...')}
                    value={searchDriver}
                    onChange={(e) => setSearchDriver(e.target.value)}
                    mb={2}
                  />
                  <Select
                    placeholder={t('contracts.form.selectDriver', 'Selecione um motorista')}
                    value={driverId}
                    onChange={(e) => {
                      setDriverId(e.target.value);
                      if (errors.driverId) {
                        setErrors({ ...errors, driverId: '' });
                      }
                    }}
                  >
                    {filteredDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.fullName} ({driver.email})
                      </option>
                    ))}
                  </Select>
                  {filteredDrivers.length === 0 && searchDriver && (
                    <Text fontSize="sm" color="gray.500" mt={2}>
                      {t('contracts.form.noDrivers', 'Nenhum motorista encontrado')}
                    </Text>
                  )}
                </>
              )}
              {errors.driverId && <FormErrorMessage>{errors.driverId}</FormErrorMessage>}
            </FormControl>

            <FormControl isInvalid={!!errors.templateId} isRequired>
              <FormLabel>{t('contracts.form.template', 'Modelo de Contrato')}</FormLabel>
              <Select
                placeholder={t('contracts.form.templatePlaceholder', 'Selecione um modelo')}
                value={templateId}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  if (errors.templateId) {
                    setErrors({ ...errors, templateId: '' });
                  }
                }}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.fileName} ({template.type === 'affiliate' ? t('templates.type.affiliate', 'Afiliado') : t('templates.type.renter', 'Locatário')})
                  </option>
                ))}
              </Select>
              {errors.templateId && <FormErrorMessage>{errors.templateId}</FormErrorMessage>}
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
            {t('common.send', 'Enviar')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
