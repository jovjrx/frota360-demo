import React, { useState, useEffect } from 'react';
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
  Textarea,
  VStack,
  HStack,
  Text,
  Box,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

interface AdminFeeExemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  driverName: string;
  onSuccess?: () => void;
}

interface ExemptionData {
  isExempt: boolean;
  exemptionStartDate: string | null;
  exemptionWeeks: number;
  createdAt: string | null;
  createdBy: string | null;
  reason?: string;
}

export function AdminFeeExemptionModal({
  isOpen,
  onClose,
  driverId,
  driverName,
  onSuccess,
}: AdminFeeExemptionModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [exemptionWeeks, setExemptionWeeks] = useState('0');
  const [reason, setReason] = useState('');
  const [currentExemption, setCurrentExemption] = useState<ExemptionData | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);

  // Carregar dados atuais ao abrir modal
  useEffect(() => {
    if (isOpen && driverId) {
      fetchExemptionData();
    }
  }, [isOpen, driverId]);

  const fetchExemptionData = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/admin/drivers/admin-fee-exemption?driverId=${driverId}`);
      const data = await res.json();

      if (data.success && data.data) {
        setCurrentExemption(data.data.exemption);
        setExemptionWeeks(data.data.exemption?.exemptionWeeks?.toString() || '0');
        setReason(data.data.exemption?.reason || '');
        setDaysRemaining(data.data.daysRemaining || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar isenção:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar dados de isenção',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const weeks = parseInt(exemptionWeeks) || 0;

      if (weeks < 0) {
        toast({
          title: 'Erro',
          description: 'Número de semanas deve ser >= 0',
          status: 'error',
          duration: 3000,
        });
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/admin/drivers/admin-fee-exemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          exemptionWeeks: weeks,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Sucesso!',
          description: data.message,
          status: 'success',
          duration: 4000,
        });

        // Recarregar dados
        await fetchExemptionData();
        onSuccess?.();
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Não foi possível salvar isenção',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao salvar isenção',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/drivers/admin-fee-exemption?driverId=${driverId}`,
        { method: 'DELETE' }
      );

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Sucesso!',
          description: data.message,
          status: 'success',
          duration: 4000,
        });

        // Limpar form
        setExemptionWeeks('0');
        setReason('');
        await fetchExemptionData();
        onSuccess?.();
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Não foi possível remover isenção',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('Erro ao remover:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao remover isenção',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Isenção de Taxa Administrativa</ModalHeader>
        <ModalCloseButton isDisabled={isLoading || isFetching} />

        <ModalBody>
          {isFetching ? (
            <VStack justify="center" py={8}>
              <Spinner size="lg" color="blue.500" />
              <Text>Carregando informações...</Text>
            </VStack>
          ) : (
            <VStack spacing={5} align="stretch">
              {/* Informações do motorista */}
              <Box p={3} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold">{driverName}</Text>
                <Text fontSize="sm" color="gray.600">
                  ID: {driverId}
                </Text>
              </Box>

              {/* Status atual */}
              {currentExemption?.isExempt && daysRemaining > 0 ? (
                <Alert status="success" borderRadius="md">
                  <AlertIcon as={FiCheckCircle} />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">
                      ✅ Motorista está isento
                    </Text>
                    <Text fontSize="sm">
                      {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} restantes
                    </Text>
                    {currentExemption.reason && (
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        Motivo: {currentExemption.reason}
                      </Text>
                    )}
                  </Box>
                </Alert>
              ) : currentExemption?.exemptionWeeks > 0 ? (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon as={FiAlertCircle} />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">
                      ⏰ Isenção expirada
                    </Text>
                    <Text fontSize="sm">O período de {currentExemption.exemptionWeeks} semana(s) já passou</Text>
                  </Box>
                </Alert>
              ) : (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">
                      ℹ️ Sem isenção ativa
                    </Text>
                    <Text fontSize="sm">Motorista está sujeito ao desconto normal de taxa</Text>
                  </Box>
                </Alert>
              )}

              <FormControl>
                <FormLabel fontWeight="bold" fontSize="sm">
                  Semanas de Isenção
                </FormLabel>
                <Input
                  type="number"
                  min="0"
                  value={exemptionWeeks}
                  onChange={(e) => setExemptionWeeks(e.target.value)}
                  placeholder="0"
                  isDisabled={isLoading}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Digite 0 para remover isenção. Máximo recomendado: 52 semanas
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="bold" fontSize="sm">
                  Motivo (opcional)
                </FormLabel>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Promoção inicial, Bônus por desempenho..."
                  rows={3}
                  isDisabled={isLoading}
                />
              </FormControl>

              {currentExemption?.createdAt && (
                <Box p={2} bg="gray.100" borderRadius="md" fontSize="xs">
                  <Text color="gray.600">
                    Criada em: {new Date(currentExemption.createdAt).toLocaleString('pt-PT')}
                  </Text>
                  {currentExemption.createdBy && (
                    <Text color="gray.600">
                      Por: {currentExemption.createdBy}
                    </Text>
                  )}
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} justify="flex-end" w="full">
            <Button
              variant="outline"
              onClick={onClose}
              isDisabled={isLoading || isFetching}
            >
              Cancelar
            </Button>

            {currentExemption?.isExempt && daysRemaining > 0 && (
              <Button
                colorScheme="red"
                variant="outline"
                onClick={handleClear}
                isLoading={isLoading}
                isDisabled={isFetching}
              >
                Remover Isenção
              </Button>
            )}

            <Button
              colorScheme="blue"
              onClick={handleSave}
              isLoading={isLoading}
              isDisabled={isFetching}
            >
              Salvar
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

