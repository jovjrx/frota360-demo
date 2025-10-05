import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import {
  Box,
  Container,
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
  Spinner,
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
import { loadTranslations, getTranslation } from '@/lib/translations';
import LoggedInLayout from '@/components/LoggedInLayout';
import { getSession } from '@/lib/session';
import { ADMIN } from '@/translations';
import { PageProps } from '@/interface/Global';

interface Request {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  driverType: 'affiliate' | 'renter';
  status: 'pending' | 'approved' | 'rejected' | 'contacted';
  createdAt: number;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    plate: string;
  };
  rejectionReason?: string;
  adminNotes?: string;
}

interface RequestsPageProps extends PageProps {
  translations: {
    common: any;
    page: any;
  };
  locale: string;
  requests: Request[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    contacted: number;
  };
}

export default function RequestsPage({ translations, locale, tCommon, tPage, requests: initialRequests, stats }: RequestsPageProps) {
  const t = tCommon || ((key: string) => getTranslation(translations.common, key));
  const tAdmin = tPage || ((key: string) => getTranslation(translations.page, key));
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtrar localmente quando mudar o filtro
  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(req => req.status === statusFilter);

  const handleAction = (request: Request, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setNotes('');
    setRejectionReason('');
    onOpen();
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    setLoading(true);

    try {
      const endpoint =
        actionType === 'approve'
          ? `/api/admin/requests/approve?requestId=${selectedRequest.id}`
          : `/api/admin/requests/reject?requestId=${selectedRequest.id}`;

      const payload =
        actionType === 'approve'
          ? { adminNotes: notes }
          : { rejectionReason, adminNotes: notes };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: `Solicitação ${actionType === 'approve' ? 'aprovada' : 'rejeitada'}`,
          status: 'success',
          duration: 3000,
        });
        onClose();
        // Recarregar a página para atualizar os dados via SSR
        window.location.reload();
      } else {
        throw new Error(data.error || data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'contacted':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'contacted':
        return 'Contactado';
      default:
        return status;
    }
  };

  const getDriverTypeLabel = (type: string) => {
    return type === 'affiliate' ? 'Afiliado' : 'Locatário';
  };

  return (
    <LoggedInLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>
              {tAdmin(ADMIN.REQUESTS.TITLE)}
            </Heading>
            <Text color="gray.600">
              {tAdmin(ADMIN.REQUESTS.SUBTITLE)}
            </Text>
          </Box>

          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>{tAdmin(ADMIN.REQUESTS.STATS_TOTAL)}</StatLabel>
                  <StatNumber>{stats.total}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>{tAdmin(ADMIN.REQUESTS.STATS_PENDING)}</StatLabel>
                  <StatNumber color="yellow.500">{stats.pending}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>{tAdmin(ADMIN.REQUESTS.STATS_APPROVED)}</StatLabel>
                  <StatNumber color="green.500">{stats.approved}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>{tAdmin(ADMIN.REQUESTS.STATS_REJECTED)}</StatLabel>
                  <StatNumber color="red.500">{stats.rejected}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filtros */}
          <HStack>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              maxW="200px"
            >
              <option value="all">{tAdmin(ADMIN.REQUESTS.FILTER_ALL)}</option>
              <option value="pending">{tAdmin(ADMIN.REQUESTS.FILTER_PENDING)}</option>
              <option value="approved">{tAdmin(ADMIN.REQUESTS.FILTER_APPROVED)}</option>
              <option value="rejected">{tAdmin(ADMIN.REQUESTS.FILTER_REJECTED)}</option>
            </Select>
          </HStack>

          {/* Tabela */}
          <Card>
            <CardBody>
              {filteredRequests.length === 0 && (
                <Text textAlign="center" py={10} color="gray.500">
                  Nenhuma solicitação encontrada
                </Text>
              )}

              {filteredRequests.length > 0 && (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Nome</Th>
                        <Th>Email</Th>
                        <Th>Telefone</Th>
                        <Th>Cidade</Th>
                        <Th>Tipo</Th>
                        <Th>Status</Th>
                        <Th>Data</Th>
                        <Th>Ações</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredRequests.map((request) => (
                        <Tr key={request.id}>
                          <Td>{`${request.firstName} ${request.lastName}`}</Td>
                          <Td>{request.email}</Td>
                          <Td>{request.phone}</Td>
                          <Td>{request.city}</Td>
                          <Td>
                            <Badge colorScheme={request.driverType === 'affiliate' ? 'green' : 'blue'}>
                              {getDriverTypeLabel(request.driverType)}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(request.status)}>
                              {getStatusLabel(request.status)}
                            </Badge>
                          </Td>
                          <Td>{new Date(request.createdAt).toLocaleDateString('pt-PT')}</Td>
                          <Td>
                            <HStack spacing={2}>
                              {request.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    colorScheme="green"
                                    onClick={() => handleAction(request, 'approve')}
                                  >
                                    {tAdmin(ADMIN.REQUESTS.APPROVE)}
                                  </Button>
                                  <Button
                                    size="sm"
                                    colorScheme="red"
                                    onClick={() => handleAction(request, 'reject')}
                                  >
                                    {tAdmin(ADMIN.REQUESTS.REJECT)}
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
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Modal de Ação */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actionType === 'approve' ? tAdmin(ADMIN.REQUESTS.APPROVE_MODAL_TITLE) : tAdmin(ADMIN.REQUESTS.REJECT_MODAL_TITLE)}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {selectedRequest && (
                <Box>
                  <Text fontWeight="bold">
                    {selectedRequest.firstName} {selectedRequest.lastName}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {selectedRequest.email} • {selectedRequest.phone}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {getDriverTypeLabel(selectedRequest.driverType)} • {selectedRequest.city}
                  </Text>
                </Box>
              )}

              {actionType === 'reject' && (
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    {tAdmin(ADMIN.REQUESTS.REJECTION_REASON)} *
                  </Text>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Descreva o motivo da rejeição..."
                    rows={3}
                  />
                </Box>
              )}

              <Box>
                <Text fontWeight="bold" mb={2}>
                  {tAdmin(ADMIN.REQUESTS.NOTES)} (opcional)
                </Text>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione notas internas..."
                  rows={3}
                />
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme={actionType === 'approve' ? 'green' : 'red'}
              onClick={confirmAction}
              isLoading={loading}
              isDisabled={actionType === 'reject' && !rejectionReason}
            >
              Confirmar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LoggedInLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);
  
  if ('redirect' in authResult) {
    return authResult;
  }

  try {
    const { fetchUnifiedAdminData } = await import('@/lib/admin/unified-data');
    
    // Buscar dados unificados incluindo requests
    const unifiedData = await fetchUnifiedAdminData({
      includeDrivers: false,
      includeVehicles: false,
      includeFleetRecords: false,
      includeIntegrations: false,
      includeRequests: true,
      includeWeeklyRecords: false,
    });

    // Converter para formato esperado pelo componente
    const requests = unifiedData.requests.map(request => ({
      id: request.id,
      firstName: request.name.split(' ')[0] || '',
      lastName: request.name.split(' ').slice(1).join(' ') || '',
      email: request.email,
      phone: request.phone,
      city: '',
      driverType: 'affiliate',
      status: request.status,
      createdAt: new Date(request.createdAt).getTime(),
      vehicle: null,
      rejectionReason: null,
      adminNotes: null,
    }));

    // Usar estatísticas do summary
    const stats = {
      total: unifiedData.summary.requests.total,
      pending: unifiedData.summary.requests.pending,
      approved: unifiedData.summary.requests.approved,
      rejected: unifiedData.summary.requests.rejected,
      contacted: 0, // Não está no summary padrão
    };

    return {
      props: {
        ...authResult.props,
        requests,
        stats,
      },
    };
  } catch (error) {
    console.error('Error fetching requests:', error);
    return {
      props: {
        ...authResult.props,
        requests: [],
        stats: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          contacted: 0,
        },
      },
    };
  }
};
