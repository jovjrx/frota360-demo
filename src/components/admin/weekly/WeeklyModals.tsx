import React, { useState } from 'react';
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
  Box,
  Alert,
  AlertIcon,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Badge,
  SimpleGrid,
  useToast,
} from '@chakra-ui/react';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

interface WeeklyModalsProps {
  // Process Modal
  processModalOpen: boolean;
  onProcessModalClose: () => void;
  selectedWeek: string;
  onProcessConfirm: () => Promise<void>;

  // Bonus Review Modal
  bonusReviewOpen: boolean;
  onBonusReviewClose: () => void;
  selectedRecord: DriverWeeklyRecord | null;

  // Payment Modal
  paymentModalOpen: boolean;
  onPaymentModalClose: () => void;
  onPaymentConfirm: (paymentData: PaymentData) => Promise<void>;

  isLoading?: boolean;
}

export interface PaymentData {
  paymentDate: string;
  notes: string;
  bonusAmount: number;
  discountAmount: number;
}

export default function WeeklyModals({
  processModalOpen,
  onProcessModalClose,
  selectedWeek,
  onProcessConfirm,
  bonusReviewOpen,
  onBonusReviewClose,
  selectedRecord,
  paymentModalOpen,
  onPaymentModalClose,
  onPaymentConfirm,
  isLoading = false,
}: WeeklyModalsProps) {
  const toast = useToast();
  const [paymentData, setPaymentData] = useState<PaymentData>({
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    bonusAmount: 0,
    discountAmount: 0,
  });

  const handleProcessClick = async () => {
    try {
      await onProcessConfirm();
      onProcessModalClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao processar semana',
        status: 'error',
      });
    }
  };

  const handlePaymentClick = async () => {
    try {
      await onPaymentConfirm(paymentData);
      onPaymentModalClose();
      setPaymentData({
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
        bonusAmount: 0,
        discountAmount: 0,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao registrar pagamento',
        status: 'error',
      });
    }
  };

  return (
    <>
      {/* ===== PROCESS MODAL ===== */}
      <Modal isOpen={processModalOpen} onClose={onProcessModalClose} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader fontSize="lg" fontWeight="bold">
            Processar Semana {selectedWeek}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Este processo irá:
                  </Text>
                  <VStack align="start" spacing={1} fontSize="sm">
                    <Text>✅ Calcular taxa administrativa (7%)</Text>
                    <Text>✅ Calcular bonus de meta (se configurado)</Text>
                    <Text>✅ Calcular bonus de indicação (se configurado)</Text>
                    <Text>✅ Calcular comissões (se configurado)</Text>
                    <Text>✅ Criar registros com status "pendente"</Text>
                  </VStack>
                </Box>
              </Alert>

              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" fontSize="sm">
                    ⚠️ Esta ação não pode ser desfeita nesta semana
                  </Text>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onProcessModalClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleProcessClick}
                isLoading={isLoading}
              >
                Processar Semana
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ===== BONUS REVIEW MODAL ===== */}
      <Modal isOpen={bonusReviewOpen} onClose={onBonusReviewClose} size="lg" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader fontSize="lg" fontWeight="bold">
            Revisão de Bonus - {selectedRecord?.driverName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRecord && (
              <VStack spacing={4} align="stretch">
                {/* Bonus Meta */}
                {selectedRecord.bonusMetaPending && selectedRecord.bonusMetaPending.length > 0 && (
                  <Box
                    borderWidth={2}
                    borderColor="yellow.300"
                    p={4}
                    borderRadius="lg"
                    bg="yellow.50"
                  >
                    <Text fontWeight="bold" mb={3} color="yellow.900" fontSize="md">
                      📊 Bonus de Meta
                    </Text>
                    <VStack align="start" spacing={2}>
                      {selectedRecord.bonusMetaPending.map((bonus, i) => (
                        <Box key={i} w="full" bg="white" p={2} borderRadius="md">
                          <HStack justify="space-between" mb={1}>
                            <Text fontWeight="semibold" fontSize="sm">
                              {bonus.description}
                            </Text>
                            <Badge colorScheme="yellow">€{bonus.amount.toFixed(2)}</Badge>
                          </HStack>
                          <Text fontSize="xs" color="gray.600">
                            Critério: {bonus.criteria} ≥ {bonus.criteriaValue}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Bonus Indicação */}
                {selectedRecord.referralBonusPending && selectedRecord.referralBonusPending.length > 0 && (
                  <Box
                    borderWidth={2}
                    borderColor="purple.300"
                    p={4}
                    borderRadius="lg"
                    bg="purple.50"
                  >
                    <Text fontWeight="bold" mb={3} color="purple.900" fontSize="md">
                      👥 Bonus de Indicação
                    </Text>
                    <VStack align="start" spacing={2}>
                      {selectedRecord.referralBonusPending.map((bonus, i) => (
                        <Box key={i} w="full" bg="white" p={2} borderRadius="md">
                          <HStack justify="space-between" mb={1}>
                            <Text fontWeight="semibold" fontSize="sm">
                              {bonus.referredDriverName}
                            </Text>
                            <Badge colorScheme="purple">€{bonus.amount.toFixed(2)}</Badge>
                          </HStack>
                          <Text fontSize="xs" color="gray.600">
                            Semanas: {bonus.weeksCompleted}/{bonus.minimumWeeksRequired}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Commission */}
                {selectedRecord.commissionPending && (
                  <Box
                    borderWidth={2}
                    borderColor="blue.300"
                    p={4}
                    borderRadius="lg"
                    bg="blue.50"
                  >
                    <Text fontWeight="bold" mb={3} color="blue.900" fontSize="md">
                      💼 Comissão
                    </Text>
                    <Box bg="white" p={2} borderRadius="md">
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="semibold" fontSize="sm">
                          {(selectedRecord.commissionPending as any).description}
                        </Text>
                        <Badge colorScheme="blue">
                          €{((selectedRecord.commissionPending as any).amount).toFixed(2)}
                        </Badge>
                      </HStack>
                      <SimpleGrid columns={2} spacing={2}>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Taxa</Text>
                          <Text fontWeight="bold" fontSize="sm">
                            {((selectedRecord.commissionPending as any).rate)}%
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Motoristas</Text>
                          <Text fontWeight="bold" fontSize="sm">
                            {((selectedRecord.commissionPending as any).subordinatesCount)}
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </Box>
                  </Box>
                )}

                {/* Total */}
                <Box
                  borderWidth={3}
                  borderColor="green.400"
                  p={4}
                  borderRadius="lg"
                  bg="green.50"
                >
                  <HStack justify="space-between">
                    <Text fontWeight="bold" color="green.900">
                      Total Bonus:
                    </Text>
                    <Text fontWeight="bold" fontSize="2xl" color="green.700">
                      €{(selectedRecord.totalBonusAmount || 0).toFixed(2)}
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onBonusReviewClose}>Fechar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ===== PAYMENT CONFIRMATION MODAL ===== */}
      <Modal isOpen={paymentModalOpen} onClose={onPaymentModalClose} size="lg" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader fontSize="lg" fontWeight="bold">
            Confirmar Pagamento - {selectedRecord?.driverName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRecord && (
              <VStack spacing={4}>
                {/* Summary */}
                <Box w="full" borderWidth={1} p={4} borderRadius="lg" bg="gray.50">
                  <Text fontWeight="bold" mb={3} fontSize="sm" color="gray.600">
                    Resumo do Pagamento
                  </Text>
                  <SimpleGrid columns={2} spacing={3}>
                    <Box>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        Ganhos
                      </Text>
                      <Text fontWeight="bold" fontSize="lg">
                        €{(selectedRecord.ganhosTotal || 0).toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        Taxa Adm (7%)
                      </Text>
                      <Text fontWeight="bold" fontSize="lg" color="red.600">
                        -€{(selectedRecord.despesasAdm || 0).toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        Bonus Pendentes
                      </Text>
                      <Text fontWeight="bold" fontSize="lg" color="purple.600">
                        +€{(selectedRecord.totalBonusAmount || 0).toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        Repasse Final
                      </Text>
                      <Text fontWeight="bold" fontSize="xl" color="green.600">
                        €{(selectedRecord.repasse || 0).toFixed(2)}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Payment Details */}
                <Box w="full">
                  <FormControl mb={4}>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Data de Pagamento
                    </FormLabel>
                    <Input
                      type="date"
                      value={paymentData.paymentDate}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, paymentDate: e.target.value })
                      }
                    />
                  </FormControl>

                  <FormControl mb={4}>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Bonus Extra (opcional)
                    </FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={paymentData.bonusAmount}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          bonusAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </FormControl>

                  <FormControl mb={4}>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Desconto (opcional)
                    </FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={paymentData.discountAmount}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          discountAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Notas
                    </FormLabel>
                    <Textarea
                      placeholder="Notas sobre este pagamento"
                      value={paymentData.notes}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, notes: e.target.value })
                      }
                      size="sm"
                    />
                  </FormControl>
                </Box>

                {/* Alert */}
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      Sistema irá processar:
                    </Text>
                    <VStack align="start" spacing={1} fontSize="xs">
                      <Text>✅ Descontar financiamento (se aplicável)</Text>
                      <Text>✅ Marcar bonus como pagos</Text>
                      <Text>✅ Guardar histórico em coleções separadas</Text>
                      <Text>✅ Atualizar status para "paid"</Text>
                    </VStack>
                  </Box>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onPaymentModalClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="green"
                onClick={handlePaymentClick}
                isLoading={isLoading}
              >
                Confirmar Pagamento
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
