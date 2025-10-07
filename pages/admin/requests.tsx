/**
 * Solicitações de Motoristas
 * Usa withAdminSSR para autenticação, traduções e dados via SSR
 */

import { useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  HStack,
  useToast,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Textarea,
  Select,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import useSWR from 'swr';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';
import { getRequests, getRequestsStats } from '@/lib/admin/adminQueries';

interface Request {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  type: 'affiliate' | 'renter';
  status: 'pending' | 'evaluation' | 'approved' | 'rejected';
  createdAt: any;
  rejectionReason?: string;
}

interface RequestsData {
  requests: Request[];
  stats: {
    total: number;
    pending: number;
    evaluation: number;
    approved: number;
    rejected: number;
  };
}

interface RequestsPageProps extends AdminPageProps {
  initialData: RequestsData;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function RequestsPage({ user, translations, locale, initialData }: RequestsPageProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'evaluation' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // SWR com fallback
  const { data, mutate } = useSWR<RequestsData>(
    `/api/admin/requests?status=${statusFilter}`,
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 10000,
    }
  );

  const filteredRequests = statusFilter === 'all'
    ? data?.requests || []
    : (data?.requests || []).filter(req => req.status === statusFilter);

  const handleAction = (request: Request, action: 'approve' | 'reject' | 'evaluation') => {
    setSelectedRequest(request);
    setActionType(action);
    setNotes('');
    setRejectionReason('');
    onOpen();
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    setLoading(true);
    try {
      const endpoint = actionType === 'approve' 
        ? `/api/admin/requests/approve?requestId=${selectedRequest.id}`
        : actionType === 'reject'
        ? `/api/admin/requests/reject?requestId=${selectedRequest.id}`
        : `/api/admin/requests/evaluation?requestId=${selectedRequest.id}`;

      const body = actionType === 'reject' 
        ? { rejectionReason }
        : { adminNotes: notes };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Falha na operação');
      }

      toast({
        title: actionType === 'approve' ? 'Solicitação aprovada' : 
               actionType === 'reject' ? 'Solicitação rejeitada' : 
               'Status atualizado',
        status: 'success',
        duration: 3000,
      });

      mutate();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível completar a ação',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'yellow',
      evaluation: 'blue',
      approved: 'green',
      rejected: 'red',
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      evaluation: 'Em Avaliação',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
    };
    return labels[status] || status;
  };

  return (
    <AdminLayout
      title="Solicitações"
      subtitle="Gerencie solicitações de novos motoristas"
      breadcrumbs={[
        { label: 'Solicitações' }
      ]}
    >
      <VStack spacing={6} align="stretch">
        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total</StatLabel>
                <StatNumber>{data?.stats.total || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Pendentes</StatLabel>
                <StatNumber color="yellow.600">{data?.stats.pending || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Em Avaliação</StatLabel>
                <StatNumber color="blue.600">{data?.stats.evaluation || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Aprovados</StatLabel>
                <StatNumber color="green.600">{data?.stats.approved || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Rejeitados</StatLabel>
                <StatNumber color="red.600">{data?.stats.rejected || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filtro */}
        <Card>
          <CardBody>
            <HStack>
              <Text fontWeight="medium">Filtrar por status:</Text>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                maxW="200px"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="evaluation">Em Avaliação</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
              </Select>
            </HStack>
          </CardBody>
        </Card>

        {/* Tabela */}
        <Card>
          <CardBody>
            <Box overflowX="auto">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Email</Th>
                    <Th>Telefone</Th>
                    <Th>Tipo</Th>
                    <Th>Status</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRequests.map((request) => (
                    <Tr key={request.id}>
                      <Td>{request.fullName}</Td>
                      <Td>{request.email}</Td>
                      <Td>{request.phone}</Td>
                      <Td>
                        <Badge colorScheme={request.type === 'renter' ? 'purple' : 'blue'}>
                          {request.type === 'renter' ? 'Locatário' : 'Afiliado'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="xs"
                                colorScheme="blue"
                                onClick={() => handleAction(request, 'evaluation')}
                              >
                                Avaliar
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="green"
                                onClick={() => handleAction(request, 'approve')}
                              >
                                Aprovar
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="red"
                                onClick={() => handleAction(request, 'reject')}
                              >
                                Rejeitar
                              </Button>
                            </>
                          )}
                          {request.status === 'evaluation' && (
                            <>
                              <Button
                                size="xs"
                                colorScheme="green"
                                onClick={() => handleAction(request, 'approve')}
                              >
                                Aprovar
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="red"
                                onClick={() => handleAction(request, 'reject')}
                              >
                                Rejeitar
                              </Button>
                            </>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </VStack>

      {/* Modal de Confirmação */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actionType === 'approve' ? 'Aprovar Solicitação' :
             actionType === 'reject' ? 'Rejeitar Solicitação' :
             'Marcar como Em Avaliação'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                {selectedRequest?.fullName} ({selectedRequest?.email})
              </Text>
              
              {actionType === 'reject' && (
                <Textarea
                  placeholder="Motivo da rejeição..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              )}
              
              {actionType !== 'reject' && (
                <Textarea
                  placeholder="Notas (opcional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme={actionType === 'approve' ? 'green' : actionType === 'reject' ? 'red' : 'blue'}
              onClick={handleConfirmAction}
              isLoading={loading}
              isDisabled={actionType === 'reject' && !rejectionReason}
            >
              Confirmar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}

// SSR com autenticação e dados iniciais
export const getServerSideProps = withAdminSSR(async (context, user) => {
  const [requests, stats] = await Promise.all([
    getRequests({ limit: 100 }),
    getRequestsStats(),
  ]);

  return {
    initialData: {
      requests,
      stats,
    },
  };
});
