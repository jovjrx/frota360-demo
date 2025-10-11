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
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { getRequests, getRequestsStats } from '@/lib/admin/adminQueries';
import StandardModal from '@/components/modals/StandardModal';
import useSWR, { SWRConfig } from 'swr';

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

function SolicitacoesPageContent({ locale, initialData, tCommon, tPage, translations }: SolicitacoesPageProps) {
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

  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);

  const { data, mutate } = useSWR<RequestsData>(
    `/api/admin/requests?status=${statusFilter}`,
    fetcher
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
      case 'pending':
        return t('requests.status.pending', 'Pendente');
      case 'evaluation':
        return t('requests.status.evaluation', 'Em avaliação');
      case 'approved':
        return t('requests.status.approved', 'Aprovada');
      case 'rejected':
        return t('requests.status.rejected', 'Rejeitada');
      default:
        return t('requests.status.unknown', 'Desconhecido');
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
        title: t(`requests.toasts.${action}.successTitle`, 'Ação concluída'),
        description: t(`requests.toasts.${action}.successDescription`, 'Operação realizada com sucesso.', {
          name: request.fullName,
        }),
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
        title: t(`requests.toasts.${action}.errorTitle`, 'Erro ao atualizar solicitação'),
        description: error.message || t(`requests.toasts.${action}.errorDescription`, 'Não foi possível concluir a ação.'),
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
      title={t('requests.title', 'Gestão de Solicitações')}
      subtitle={t('requests.subtitle', 'Analise e gerencie as candidaturas de motoristas')}
      breadcrumbs={[
        { label: t('requests.title', 'Gestão de Solicitações') }
      ]}
      translations={translations}
    >
      <VStack spacing={6} align="stretch">
        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{t('requests.stats.total', 'Total')}</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{t('requests.status.pending', 'Pendente')}</StatLabel>
                <StatNumber color="orange.600">{stats.pending}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{t('requests.status.evaluation', 'Em avaliação')}</StatLabel>
                <StatNumber color="blue.600">{stats.evaluation}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{t('requests.status.approved', 'Aprovada')}</StatLabel>
                <StatNumber color="green.600">{stats.approved}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{t('requests.status.rejected', 'Rejeitada')}</StatLabel>
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
                  placeholder={t('requests.filters.searchPlaceholder', 'Pesquisar por nome, email ou telefone')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                maxW="200px"
              >
                <option value="all">{t('requests.filters.status.all', 'Todas')}</option>
                <option value="pending">{t('requests.status.pending', 'Pendente')}</option>
                <option value="evaluation">{t('requests.status.evaluation', 'Em avaliação')}</option>
                <option value="approved">{t('requests.status.approved', 'Aprovada')}</option>
                <option value="rejected">{t('requests.status.rejected', 'Rejeitada')}</option>
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
                <Text mt={4} color="gray.600">{tc('messages.loading', 'A carregar...')}</Text>
              </Center>
            ) : filteredRequests.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>{t('requests.empty.title', 'Nenhuma solicitação encontrada')}</AlertTitle>
                <AlertDescription>{t('requests.empty.description', 'Não há solicitações com os filtros selecionados.')}</AlertDescription>
              </Alert>
            ) : (
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>{t('requests.table.headers.name', 'Nome')}</Th>
                      <Th>{t('requests.table.headers.email', 'Email')}</Th>
                      <Th>{t('requests.table.headers.phone', 'Telefone')}</Th>
                      <Th>{t('requests.table.headers.type', 'Tipo')}</Th>
                      <Th>{t('requests.table.headers.status', 'Status')}</Th>
                      <Th>{t('requests.table.headers.actions', 'Ações')}</Th>
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
                            {request.type === 'renter'
                              ? t('requests.types.renter', 'Locatário')
                              : t('requests.types.affiliate', 'Afiliado')}
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
                                {t('requests.actions.viewDetails', 'Ver detalhes')}
                              </MenuItem>
                              {request.status === 'pending' && (
                                <MenuItem icon={<FiClock />} onClick={() => {
                                  setSelectedRequest(request);
                                  setEvaluationNotes(request.adminNotes || '');
                                  onEvaluationModalOpen();
                                }}>
                                  {t('requests.actions.evaluate', 'Avaliar')}
                                </MenuItem>
                              )}
                              {(request.status === 'pending' || request.status === 'evaluation') && (
                                <MenuItem icon={<FiUserPlus />} onClick={() => handleAction('approve', request)}>
                                  {t('requests.actions.approve', 'Aprovar')}
                                </MenuItem>
                              )}
                              {(request.status === 'pending' || request.status === 'evaluation') && (
                                <MenuItem icon={<FiXCircle />} onClick={() => {
                                  setSelectedRequest(request);
                                  onRejectModalOpen();
                                }} color="red.500">
                                  {t('requests.actions.reject', 'Rejeitar')}
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
        title={t('requests.modals.view.title', 'Detalhes da solicitação')}
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
              <Text fontSize="sm" color="gray.500">{t('requests.modals.view.createdAt', 'Criada em')}</Text>
              <Text>{new Date(selectedRequest.createdAt).toLocaleString(locale)}</Text>
            </Box>
            {selectedRequest.updatedAt && (
              <Box>
                <Text fontSize="sm" color="gray.500">{t('requests.modals.view.updatedAt', 'Atualizada em')}</Text>
                <Text>{new Date(selectedRequest.updatedAt).toLocaleString(locale)}</Text>
              </Box>
            )}
            {selectedRequest.adminNotes && (
              <Box>
                <Text fontSize="sm" color="gray.500">{t('requests.modals.view.adminNotes', 'Notas administrativas')}</Text>
                <Textarea value={selectedRequest.adminNotes} isReadOnly />
              </Box>
            )}
            {selectedRequest.rejectionReason && (
              <Box>
                <Text fontSize="sm" color="gray.500">{t('requests.modals.view.rejectionReason', 'Motivo da rejeição')}</Text>
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
        title={t('requests.modals.evaluation.title', 'Colocar em avaliação')}
        onSave={() => selectedRequest && handleAction('evaluate', selectedRequest, evaluationNotes)}
        saveText={t('requests.modals.evaluation.saveButton', 'Salvar avaliação')}
      >
        {selectedRequest && (
          <VStack spacing={4} align="stretch">
            <Text>{t('requests.modals.evaluation.description', 'Adicione notas para a avaliação de {{name}}.', {
              name: selectedRequest.fullName,
            })}</Text>
            <FormControl>
              <FormLabel>{t('requests.modals.evaluation.notesLabel', 'Notas de avaliação')}</FormLabel>
              <Textarea
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                placeholder={t('requests.modals.evaluation.notesPlaceholder', 'Escreva as observações internas')}
              />
            </FormControl>
          </VStack>
        )}
      </StandardModal>

      {/* Reject Modal */}
      <StandardModal
        isOpen={isRejectModalOpen}
        onClose={onRejectModalClose}
        title={t('requests.modals.reject.title', 'Rejeitar solicitação')}
        onSave={() => selectedRequest && handleAction('reject', selectedRequest, rejectionReason)}
        saveText={t('requests.modals.reject.saveButton', 'Confirmar rejeição')}
        showDelete={false}
      >
        {selectedRequest && (
          <VStack spacing={4} align="stretch">
            <Alert status="warning">
              <AlertIcon />
              <AlertDescription>
                {t('requests.modals.reject.confirmation', 'Tem certeza que deseja rejeitar {{name}}?', {
                  name: selectedRequest.fullName,
                })}
              </AlertDescription>
            </Alert>
            <FormControl>
              <FormLabel>{t('requests.modals.reject.reasonLabel', 'Motivo da rejeição')}</FormLabel>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('requests.modals.reject.reasonPlaceholder', 'Descreva o motivo da rejeição')}
              />
            </FormControl>
          </VStack>
        )}
      </StandardModal>
    </AdminLayout>
  );
}

// SSR com autenticação, traduções e dados iniciais
export default function SolicitacoesPage(props: SolicitacoesPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/admin/requests?status=all': props.initialData,
        },
      }}
    >
      <SolicitacoesPageContent {...props} />
    </SWRConfig>
  );
}

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


