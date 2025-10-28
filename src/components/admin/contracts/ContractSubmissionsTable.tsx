import { useMemo, useState } from 'react';
import {
  Card,
  CardBody,
  Heading,
  VStack,
  HStack,
  Text,
  Select,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  ButtonGroup,
  Icon,
  useToast,
  Spinner,
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
} from '@chakra-ui/react';
import { FiCheckCircle, FiClock, FiAlertTriangle, FiRefreshCcw, FiDownload, FiFileText } from 'react-icons/fi';
import type { DriverContract } from '@/schemas/driver-contract';

interface DriverContractWithUrl extends DriverContract {
  signedDocumentDownloadUrl?: string | null;
}

interface ContractSubmissionsTableProps {
  contracts: DriverContractWithUrl[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const STATUS_CONFIG: Record<DriverContract['status'], { label: string; color: string; icon: typeof FiClock }> = {
  pending_signature: { label: 'Pendente de assinatura', color: 'yellow', icon: FiClock },
  submitted: { label: 'Submetido', color: 'blue', icon: FiFileText },
  approved: { label: 'Aprovado', color: 'green', icon: FiCheckCircle },
  rejected: { label: 'Rejeitado', color: 'red', icon: FiAlertTriangle },
};

const formatDate = (value: string | null): string => {
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

export function ContractSubmissionsTable({ contracts, isLoading = false, onRefresh }: ContractSubmissionsTableProps) {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<'all' | DriverContract['status']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'affiliate' | 'renter'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectingContract, setRejectingContract] = useState<DriverContractWithUrl | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      if (statusFilter !== 'all' && contract.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== 'all' && contract.contractType !== typeFilter) {
        return false;
      }

      const lowerSearch = searchTerm.trim().toLowerCase();
      if (!lowerSearch) {
        return true;
      }

      return (
        contract.driverName.toLowerCase().includes(lowerSearch) ||
        contract.driverEmail?.toLowerCase().includes(lowerSearch) ||
        contract.driverId.toLowerCase().includes(lowerSearch)
      );
    });
  }, [contracts, statusFilter, typeFilter, searchTerm]);

  const refresh = () => {
    onRefresh?.();
  };

  const approveContract = async (contract: DriverContractWithUrl) => {
    try {
      setIsApprovingId(contract.id);
      const response = await fetch(`/api/admin/contracts/submissions/${contract.id}/approve`, {
        method: 'PUT',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error ?? 'Erro ao aprovar contrato');
      }

      toast({
        title: 'Contrato aprovado',
        status: 'success',
        duration: 3000,
      });
      refresh();
    } catch (error: any) {
      console.error('[Contracts] Failed to approve contract:', error);
      toast({
        title: 'Erro ao aprovar',
        description: error?.message ?? 'Tente novamente mais tarde.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsApprovingId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectingContract) {
      return;
    }

    if (!rejectReason.trim()) {
      toast({
        title: 'Informe o motivo da rejeição',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      setIsRejecting(true);
      const response = await fetch(`/api/admin/contracts/submissions/${rejectingContract.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error ?? 'Erro ao rejeitar contrato');
      }

      toast({
        title: 'Contrato rejeitado',
        status: 'success',
        duration: 3000,
      });

      setRejectingContract(null);
      setRejectReason('');
      refresh();
    } catch (error: any) {
      console.error('[Contracts] Failed to reject contract:', error);
      toast({
        title: 'Erro ao rejeitar',
        description: error?.message ?? 'Tente novamente mais tarde.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Card variant="outline">
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <HStack spacing={3} align={{ base: 'stretch', md: 'center' }} flexWrap="wrap">
            <HStack spacing={2} flex={1} minW={{ base: '100%', md: '40%' }}>
              <Icon as={FiFileText} boxSize={6} color="teal.500" />
              <VStack align="start" spacing={0}>
                <Heading size="sm">Documentos enviados</Heading>
                <Text fontSize="sm" color="gray.600">
                  Acompanhe uploads de motoristas e aprove ou rejeite conformidade.
                </Text>
              </VStack>
            </HStack>

            <Button leftIcon={<FiRefreshCcw />} variant="ghost" size="sm" onClick={refresh}>
              Atualizar
            </Button>
          </HStack>

          <HStack spacing={3} flexWrap="wrap">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              maxW={{ base: '100%', md: '200px' }}
            >
              <option value="all">Todos os status</option>
              <option value="pending_signature">Pendente assinatura</option>
              <option value="submitted">Submetido</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
            </Select>

            <Select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
              maxW={{ base: '100%', md: '200px' }}
            >
              <option value="all">Todos os tipos</option>
              <option value="affiliate">Afiliado</option>
              <option value="renter">Locatário</option>
            </Select>

            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pesquisar motorista..."
              maxW={{ base: '100%', md: '260px' }}
            />
          </HStack>

          {isLoading ? (
            <HStack justify="center" py={8}>
              <Spinner />
              <Text fontSize="sm" color="gray.600">Carregando documentos...</Text>
            </HStack>
          ) : filteredContracts.length === 0 ? (
            <Box borderWidth="1px" borderRadius="lg" p={6} textAlign="center" color="gray.500">
              <Text fontWeight="semibold">Nenhum documento encontrado</Text>
              <Text fontSize="sm">Ajuste filtros ou aguarde novos envios.</Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Motorista</Th>
                    <Th>Tipo</Th>
                    <Th>Status</Th>
                    <Th>Versão</Th>
                    <Th>Enviado em</Th>
                    <Th>Atualizado</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredContracts.map((contract) => {
                    const statusConfig = STATUS_CONFIG[contract.status];
                    return (
                      <Tr key={contract.id}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="semibold">{contract.driverName}</Text>
                            <Text fontSize="xs" color="gray.500">{contract.driverEmail ?? 'Sem email'}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={contract.contractType === 'affiliate' ? 'blue' : 'purple'}>
                            {contract.contractType === 'affiliate' ? 'Afiliado' : 'Locatário'}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={statusConfig.color}>{statusConfig.label}</Badge>
                          {contract.rejectionReason && (
                            <Text fontSize="xs" color="red.500" mt={1}>
                              Motivo: {contract.rejectionReason}
                            </Text>
                          )}
                        </Td>
                        <Td>{contract.templateVersion}</Td>
                        <Td>{formatDate(contract.submittedAt)}</Td>
                        <Td>{formatDate(contract.updatedAt)}</Td>
                        <Td>
                          <ButtonGroup size="xs" variant="ghost">
                            {contract.signedDocumentDownloadUrl && (
                              <Button
                                as="a"
                                href={contract.signedDocumentDownloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                leftIcon={<FiDownload />}
                              >
                                Baixar
                              </Button>
                            )}
                            <Button
                              colorScheme="green"
                              leftIcon={<FiCheckCircle />}
                              onClick={() => approveContract(contract)}
                              isLoading={isApprovingId === contract.id}
                              isDisabled={contract.status === 'approved'}
                            >
                              Aprovar
                            </Button>
                            <Button
                              colorScheme="red"
                              leftIcon={<FiAlertTriangle />}
                              onClick={() => {
                                setRejectingContract(contract);
                                setRejectReason(contract.rejectionReason ?? '');
                              }}
                            >
                              Rejeitar
                            </Button>
                          </ButtonGroup>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          )}
        </VStack>
      </CardBody>

      <Modal isOpen={Boolean(rejectingContract)} onClose={() => setRejectingContract(null)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rejeitar documento</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="gray.600" mb={3}>
              Informe o motivo da rejeição. O motorista receberá esta mensagem.
            </Text>
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              minH="120px"
              placeholder="Descreva o motivo da rejeição..."
            />
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={() => setRejectingContract(null)} isDisabled={isRejecting}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={confirmReject} isLoading={isRejecting}>
              Confirmar rejeição
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}

