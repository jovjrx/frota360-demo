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

interface RequestsPageProps {
  translations: any;
  locale: string;
}

export default function RequestsPage({ translations, locale }: RequestsPageProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const t = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.common, key, variables);
  };

  const tAdmin = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.admin, key, variables);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/requests/index?status=${statusFilter}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.data);
      } else {
        throw new Error(data.error || data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar solicitações',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

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
        fetchRequests();
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

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
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
            <Button onClick={fetchRequests} isLoading={loading}>
              Atualizar
            </Button>
          </HStack>

          {/* Tabela */}
          <Card>
            <CardBody>
              {loading && (
                <Box textAlign="center" py={10}>
                  <Spinner size="xl" color="green.500" />
                </Box>
              )}

              {!loading && requests.length === 0 && (
                <Text textAlign="center" py={10} color="gray.500">
                  Nenhuma solicitação encontrada
                </Text>
              )}

              {!loading && requests.length > 0 && (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>{tAdmin(ADMIN.REQUESTS.TABLE_NAME)}</Th>
                        <Th>{tAdmin(ADMIN.REQUESTS.TABLE_EMAIL)}</Th>
                        <Th>{tAdmin(ADMIN.REQUESTS.TABLE_PHONE)}</Th>
                        <Th>Cidade</Th>
                        <Th>{tAdmin(ADMIN.REQUESTS.TABLE_TYPE)}</Th>
                        <Th>{tAdmin(ADMIN.REQUESTS.TABLE_STATUS)}</Th>
                        <Th>{tAdmin(ADMIN.REQUESTS.TABLE_DATE)}</Th>
                        <Th>{tAdmin(ADMIN.REQUESTS.TABLE_ACTIONS)}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {requests.map((request) => (
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
  try {
    const session = await getSession(context.req, context.res);

    // Verificar se está logado e se tem role de admin
    if (!session?.isLoggedIn || (session.role !== 'admin' && session.user?.role !== 'admin')) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    const locale = Array.isArray(context.req.headers['x-locale'])
      ? context.req.headers['x-locale'][0]
      : context.req.headers['x-locale'] || 'pt';

    const translations = await loadTranslations(locale, ['common', 'admin']);

    return {
      props: {
        translations,
        locale,
      },
    };
  } catch (error) {
    console.error('Failed to load translations:', error);
    return {
      props: {
        translations: { common: {}, admin: {} },
        locale: 'pt',
      },
    };
  }
};
