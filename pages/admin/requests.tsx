import { useState, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  useToast,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Center,
  Textarea,
  FormControl,
  FormLabel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiMoreVertical, FiCheckCircle, FiXCircle, FiClock, FiMail, FiUserPlus, FiPhone } from 'react-icons/fi';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { getRequests, getRequestsStats } from '@/lib/admin/adminQueries';
import StandardModal from '@/components/modals/StandardModal';
import useSWR from 'swr';

interface DriverRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  type: 'affiliate' | 'renter';
  status: 'pending' | 'evaluation' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

interface RequestsData {
  requests: DriverRequest[];
  stats: {
    total: number;
    pending: number;
    evaluation: number;
    approved: number;
    rejected: number;
  };
}

interface SolicitacoesPageProps extends AdminPageProps {
  initialData: RequestsData;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const COMMON_FALLBACKS: Record<string, string> = {
  total: 'Total',
  all: 'Todas',
  name: 'Nome',
  email: 'Email',
  phone: 'Telefone',
  type: 'Tipo',
  status: 'Status',
  actions: 'Ações',
  type_renter: 'Locatário',
  type_affiliate: 'Afiliado',
  'common.loading': 'A carregar...',
};

const ADMIN_FALLBACKS: Record<string, string> = {
  'requests.title': 'Gestão de Solicitações',
  'requests.subtitle': 'Analise e gerencie as candidaturas de motoristas',
  'requests.status.pending': 'Pendente',
  'requests.status.evaluation': 'Em avaliação',
  'requests.status.approved': 'Aprovada',
  'requests.status.rejected': 'Rejeitada',
  'requests.status.unknown': 'Desconhecido',
  'requests.search_placeholder': 'Pesquisar por nome, email ou telefone',
  'requests.no_requests.title': 'Nenhuma solicitação encontrada',
  'requests.no_requests.desc': 'Não há solicitações com os filtros selecionados.',
  'requests.action.view_details': 'Ver detalhes',
  'requests.action.evaluate': 'Avaliar',
  'requests.action.approve': 'Aprovar',
  'requests.action.reject': 'Rejeitar',
  'requests.action.evaluate_success_title': 'Solicitação marcada como em avaliação',
  'requests.action.evaluate_success_desc': 'A solicitação de {{name}} foi marcada como em avaliação.',
  'requests.action.evaluate_error_title': 'Erro ao marcar avaliação',
  'requests.action.evaluate_error_desc': 'Não foi possível marcar a solicitação como em avaliação.',
  'requests.action.approve_success_title': 'Solicitação aprovada',
  'requests.action.approve_success_desc': 'A solicitação de {{name}} foi aprovada com sucesso.',
  'requests.action.approve_error_title': 'Erro ao aprovar',
  'requests.action.approve_error_desc': 'Não foi possível aprovar a solicitação.',
  'requests.action.reject_success_title': 'Solicitação rejeitada',
  'requests.action.reject_success_desc': 'A solicitação de {{name}} foi rejeitada.',
  'requests.action.reject_error_title': 'Erro ao rejeitar',
  'requests.action.reject_error_desc': 'Não foi possível rejeitar a solicitação.',
  'requests.view_modal.title': 'Detalhes da solicitação',
  'requests.view_modal.created_at': 'Criada em',
  'requests.view_modal.updated_at': 'Atualizada em',
  'requests.view_modal.admin_notes': 'Notas administrativas',
  'requests.view_modal.rejection_reason': 'Motivo da rejeição',
  'requests.evaluation_modal.title': 'Colocar em avaliação',
  'requests.evaluation_modal.save_button': 'Salvar avaliação',
  'requests.evaluation_modal.description': 'Adicione notas para a avaliação de {{name}}.',
  'requests.evaluation_modal.notes_label': 'Notas de avaliação',
  'requests.evaluation_modal.notes_placeholder': 'Escreva as observações internas',
  'requests.reject_modal.title': 'Rejeitar solicitação',
  'requests.reject_modal.reject_button': 'Confirmar rejeição',
  'requests.reject_modal.confirmation': 'Tem certeza que deseja rejeitar {{name}}?',
  'requests.reject_modal.reason_label': 'Motivo da rejeição',
  'requests.reject_modal.reason_placeholder': 'Descreva o motivo da rejeição',
};

export default function SolicitacoesPage({ locale, initialData, tCommon, tPage }: SolicitacoesPageProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<DriverRequest | null>(null);
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();
  const { isOpen: isEvaluationModalOpen, onOpen: onEvaluationModalOpen, onClose: onEvaluationModalClose } = useDisclosure();
  const { isOpen: isRejectModalOpen, onOpen: onRejectModalOpen, onClose: onRejectModalClose } = useDisclosure();

  const makeSafeT = (
    fn: ((key: string) => any) | undefined,
    fallbacks: Record<string, string>
  ) => (key: string, variables?: Record<string, any>) => {
    let value = fn ? fn(key) : undefined;
    if (typeof value !== 'string' || value === key) {
      value = fallbacks[key] ?? key;
    }
    if (variables && typeof value === 'string') {
      return Object.entries(variables).reduce(
        (acc, [varKey, varValue]) => acc.replace(new RegExp(`{{\\s*${varKey}\\s*}}`, 'g'), String(varValue)),
        value as string
      );
    }
    return value as string;
  };

  const t = makeSafeT(tCommon, COMMON_FALLBACKS);
  const tAdmin = makeSafeT(tPage, ADMIN_FALLBACKS);

  const { data, mutate } = useSWR<RequestsData>(
    `/api/admin/requests?status=${statusFilter}`,
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 10000,
    }
  );

  const requests = data?.requests || [];
  const stats = data?.stats || { total: 0, pending: 0, evaluation: 0, approved: 0, rejected: 0 };

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch =
        request.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.phone?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [requests, searchTerm]);

  const getStatusColor = (status: DriverRequest['status']) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'evaluation': return 'blue';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: DriverRequest['status']) => {
    switch (status) {
      case 'pending': return tAdmin('requests.status.pending');
      case 'evaluation': return tAdmin('requests.status.evaluation');
      case 'approved': return tAdmin('requests.status.approved');
      case 'rejected': return tAdmin('requests.status.rejected');
      default: return tAdmin('requests.status.unknown');
    }
  };

  const handleAction = async (action: 'evaluate' | 'approve' | 'reject', request: DriverRequest, notes?: string) => {
    setLoading(true);
    try {
      const endpoint = `/api/admin/requests/${action}`;
      const body: any = { requestId: request.id };

      if (action === 'evaluate') {
        body.adminNotes = notes;
      } else if (action === 'reject') {
        body.rejectionReason = notes;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} request`);
      }

      toast({
        title: tAdmin(`requests.action.${action}_success_title`),
        description: tAdmin(`requests.action.${action}_success_desc`, { name: request.fullName }),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      mutate(); // Recarregar a lista de solicitações via SWR
      onViewModalClose();
      onEvaluationModalClose();
      onRejectModalClose();
    } catch (error: any) {
      toast({
        title: tAdmin(`requests.action.${action}_error_title`),
        description: error.message || tAdmin(`requests.action.${action}_error_desc`),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title={tAdmin('requests.title')}
      subtitle={tAdmin('requests.subtitle')}
      breadcrumbs={[
        { label: tAdmin('requests.title') }
      ]}
    >
      <VStack spacing={6} align="stretch">
        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{t('total')}</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{tAdmin('requests.status.pending')}</StatLabel>
                <StatNumber color="orange.600">{stats.pending}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{tAdmin('requests.status.evaluation')}</StatLabel>
                <StatNumber color="blue.600">{stats.evaluation}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{tAdmin('requests.status.approved')}</StatLabel>
                <StatNumber color="green.600">{stats.approved}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{tAdmin('requests.status.rejected')}</StatLabel>
                <StatNumber color="red.600">{stats.rejected}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filtro e Busca */}
        <Card>
          <CardBody>
            <HStack spacing={4} justify="space-between">
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder={tAdmin('requests.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                maxW="200px"
              >
                <option value="all">{t('all')}</option>
                <option value="pending">{tAdmin('requests.status.pending')}</option>
                <option value="evaluation">{tAdmin('requests.status.evaluation')}</option>
                <option value="approved">{tAdmin('requests.status.approved')}</option>
                <option value="rejected">{tAdmin('requests.status.rejected')}</option>
              </Select>
            </HStack>
          </CardBody>
        </Card>

        {/* Tabela */}
        <Card>
          <CardBody>
            {loading ? (
              <Center py={10}>
                <Spinner size="xl" color="blue.500" />
                <Text mt={4} color="gray.600">{t('common.loading')}</Text>
              </Center>
            ) : filteredRequests.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>{tAdmin('requests.no_requests.title')}</AlertTitle>
                <AlertDescription>{tAdmin('requests.no_requests.desc')}</AlertDescription>
              </Alert>
            ) : (
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>{t('name')}</Th>
                      <Th>{t('email')}</Th>
                      <Th>{t('phone')}</Th>
                      <Th>{t('type')}</Th>
                      <Th>{t('status')}</Th>
                      <Th>{t('actions')}</Th>
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
                            {request.type === 'renter' ? t('type_renter') : t('type_affiliate')}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(request.status)}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
                            <MenuList>
                              <MenuItem onClick={() => {
                                setSelectedRequest(request);
                                onViewModalOpen();
                              }}>
                                {tAdmin('requests.action.view_details')}
                              </MenuItem>
                              {request.status === 'pending' && (
                                <MenuItem icon={<FiClock />} onClick={() => {
                                  setSelectedRequest(request);
                                  setEvaluationNotes(request.adminNotes || '');
                                  onEvaluationModalOpen();
                                }}>
                                  {tAdmin('requests.action.evaluate')}
                                </MenuItem>
                              )}
                              {(request.status === 'pending' || request.status === 'evaluation') && (
                                <MenuItem icon={<FiUserPlus />} onClick={() => handleAction('approve', request)}>
                                  {tAdmin('requests.action.approve')}
                                </MenuItem>
                              )}
                              {(request.status === 'pending' || request.status === 'evaluation') && (
                                <MenuItem icon={<FiXCircle />} onClick={() => {
                                  setSelectedRequest(request);
                                  onRejectModalOpen();
                                }} color="red.500">
                                  {tAdmin('requests.action.reject')}
                                </MenuItem>
                              )}
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* View Request Modal */}
      <StandardModal
        isOpen={isViewModalOpen}
        onClose={onViewModalClose}
        title={tAdmin('requests.view_modal.title')}
        size="xl"
        showSave={false}
      >
        {selectedRequest && (
          <VStack spacing={4} align="stretch">
            <HStack>
              <VStack align="flex-start" spacing={1}>
                <Text fontSize="lg" fontWeight="bold">{selectedRequest.fullName}</Text>
                <Text color="gray.600">{selectedRequest.email}</Text>
                <Text color="gray.600">{selectedRequest.phone}</Text>
                <Badge colorScheme={getStatusColor(selectedRequest.status)}>
                  {getStatusLabel(selectedRequest.status)}
                </Badge>
              </VStack>
            </HStack>
            <Box>
              <Text fontSize="sm" color="gray.500">{tAdmin('requests.view_modal.created_at')}</Text>
              <Text>{new Date(selectedRequest.createdAt).toLocaleString(locale)}</Text>
            </Box>
            {selectedRequest.updatedAt && (
              <Box>
                <Text fontSize="sm" color="gray.500">{tAdmin('requests.view_modal.updated_at')}</Text>
                <Text>{new Date(selectedRequest.updatedAt).toLocaleString(locale)}</Text>
              </Box>
            )}
            {selectedRequest.adminNotes && (
              <Box>
                <Text fontSize="sm" color="gray.500">{tAdmin('requests.view_modal.admin_notes')}</Text>
                <Textarea value={selectedRequest.adminNotes} isReadOnly />
              </Box>
            )}
            {selectedRequest.rejectionReason && (
              <Box>
                <Text fontSize="sm" color="gray.500">{tAdmin('requests.view_modal.rejection_reason')}</Text>
                <Textarea value={selectedRequest.rejectionReason} isReadOnly />
              </Box>
            )}
          </VStack>
        )}
      </StandardModal>

      {/* Evaluation Modal */}
      <StandardModal
        isOpen={isEvaluationModalOpen}
        onClose={onEvaluationModalClose}
        title={tAdmin('requests.evaluation_modal.title')}
        onSave={() => selectedRequest && handleAction('evaluate', selectedRequest, evaluationNotes)}
        saveText={tAdmin('requests.evaluation_modal.save_button')}
      >
        {selectedRequest && (
          <VStack spacing={4} align="stretch">
            <Text>{tAdmin('requests.evaluation_modal.description', { name: selectedRequest.fullName })}</Text>
            <FormControl>
              <FormLabel>{tAdmin('requests.evaluation_modal.notes_label')}</FormLabel>
              <Textarea
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                placeholder={tAdmin('requests.evaluation_modal.notes_placeholder')}
              />
            </FormControl>
          </VStack>
        )}
      </StandardModal>

      {/* Reject Modal */}
      <StandardModal
        isOpen={isRejectModalOpen}
        onClose={onRejectModalClose}
        title={tAdmin('requests.reject_modal.title')}
        onSave={() => selectedRequest && handleAction('reject', selectedRequest, rejectionReason)}
        saveText={tAdmin('requests.reject_modal.reject_button')}
        showDelete={false}
      >
        {selectedRequest && (
          <VStack spacing={4} align="stretch">
            <Alert status="warning">
              <AlertIcon />
              <AlertDescription>
                {tAdmin('requests.reject_modal.confirmation', { name: selectedRequest.fullName })}
              </AlertDescription>
            </Alert>
            <FormControl>
              <FormLabel>{tAdmin('requests.reject_modal.reason_label')}</FormLabel>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={tAdmin('requests.reject_modal.reason_placeholder')}
              />
            </FormControl>
          </VStack>
        )}
      </StandardModal>
    </AdminLayout>
  );
}

// SSR com autenticação, traduções e dados iniciais
export const getServerSideProps = withAdminSSR(async (context, user) => {
  // Carregar dados iniciais diretamente do Firestore
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


