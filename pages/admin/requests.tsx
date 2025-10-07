import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
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
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';
import { getTranslation } from '@/lib/translations';
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

export default function SolicitacoesPage({ user, translations, locale, initialData }: SolicitacoesPageProps) {
  const router = useRouter();
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

  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tPage = (key: string, variables?: Record<string, any>) => getTranslation(translations.page, key, variables) || key;

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
      case 'pending': return tPage('requests.status.pending');
      case 'evaluation': return tPage('requests.status.evaluation');
      case 'approved': return tPage('requests.status.approved');
      case 'rejected': return tPage('requests.status.rejected');
      default: return tPage('requests.status.unknown');
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
        title: tPage(`requests.action.${action}_success_title`),
        description: tPage(`requests.action.${action}_success_desc`, { name: request.fullName }),
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
        title: tPage(`requests.action.${action}_error_title`),
        description: error.message || tPage(`requests.action.${action}_error_desc`),
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
      title={tPage('requests.title')}
      subtitle={tPage('requests.subtitle')}
      breadcrumbs={[
        { label: tPage('requests.title') }
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
                <StatLabel>{tPage('requests.status.pending')}</StatLabel>
                <StatNumber color="orange.600">{stats.pending}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{tPage('requests.status.evaluation')}</StatLabel>
                <StatNumber color="blue.600">{stats.evaluation}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{tPage('requests.status.approved')}</StatLabel>
                <StatNumber color="green.600">{stats.approved}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{tPage('requests.status.rejected')}</StatLabel>
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
                  placeholder={tPage('requests.search_placeholder')}
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
                <option value="pending">{tPage('requests.status.pending')}</option>
                <option value="evaluation">{tPage('requests.status.evaluation')}</option>
                <option value="approved">{tPage('requests.status.approved')}</option>
                <option value="rejected">{tPage('requests.status.rejected')}</option>
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
                <AlertTitle>{tPage('requests.no_requests.title')}</AlertTitle>
                <AlertDescription>{tPage('requests.no_requests.desc')}</AlertDescription>
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
                                {tPage('requests.action.view_details')}
                              </MenuItem>
                              {request.status === 'pending' && (
                                <MenuItem icon={<FiClock />} onClick={() => {
                                  setSelectedRequest(request);
                                  setEvaluationNotes(request.adminNotes || '');
                                  onEvaluationModalOpen();
                                }}>
                                  {tPage('requests.action.evaluate')}
                                </MenuItem>
                              )}
                              {(request.status === 'pending' || request.status === 'evaluation') && (
                                <MenuItem icon={<FiUserPlus />} onClick={() => handleAction('approve', request)}>
                                  {tPage('requests.action.approve')}
                                </MenuItem>
                              )}
                              {(request.status === 'pending' || request.status === 'evaluation') && (
                                <MenuItem icon={<FiXCircle />} onClick={() => {
                                  setSelectedRequest(request);
                                  onRejectModalOpen();
                                }} color="red.500">
                                  {tPage('requests.action.reject')}
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
        title={tPage('requests.view_modal.title')}
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
              <Text fontSize="sm" color="gray.500">{tPage('requests.view_modal.created_at')}</Text>
              <Text>{new Date(selectedRequest.createdAt).toLocaleString(locale)}</Text>
            </Box>
            {selectedRequest.updatedAt && (
              <Box>
                <Text fontSize="sm" color="gray.500">{tPage('requests.view_modal.updated_at')}</Text>
                <Text>{new Date(selectedRequest.updatedAt).toLocaleString(locale)}</Text>
              </Box>
            )}
            {selectedRequest.adminNotes && (
              <Box>
                <Text fontSize="sm" color="gray.500">{tPage('requests.view_modal.admin_notes')}</Text>
                <Textarea value={selectedRequest.adminNotes} isReadOnly />
              </Box>
            )}
            {selectedRequest.rejectionReason && (
              <Box>
                <Text fontSize="sm" color="gray.500">{tPage('requests.view_modal.rejection_reason')}</Text>
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
        title={tPage('requests.evaluation_modal.title')}
        onSave={() => selectedRequest && handleAction('evaluate', selectedRequest, evaluationNotes)}
        saveText={tPage('requests.evaluation_modal.save_button')}
      >
        {selectedRequest && (
          <VStack spacing={4} align="stretch">
            <Text>{tPage('requests.evaluation_modal.description', { name: selectedRequest.fullName })}</Text>
            <FormControl>
              <FormLabel>{tPage('requests.evaluation_modal.notes_label')}</FormLabel>
              <Textarea
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                placeholder={tPage('requests.evaluation_modal.notes_placeholder')}
              />
            </FormControl>
          </VStack>
        )}
      </StandardModal>

      {/* Reject Modal */}
      <StandardModal
        isOpen={isRejectModalOpen}
        onClose={onRejectModalClose}
        title={tPage('requests.reject_modal.title')}
        onSave={() => selectedRequest && handleAction('reject', selectedRequest, rejectionReason)}
        saveText={tPage('requests.reject_modal.reject_button')}
        showDelete={false}
      >
        {selectedRequest && (
          <VStack spacing={4} align="stretch">
            <Alert status="warning">
              <AlertIcon />
              <AlertDescription>
                {tPage('requests.reject_modal.confirmation', { name: selectedRequest.fullName })}
              </AlertDescription>
            </Alert>
            <FormControl>
              <FormLabel>{tPage('requests.reject_modal.reason_label')}</FormLabel>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={tPage('requests.reject_modal.reason_placeholder')}
              />
            </FormControl>
          </VStack>
        )}
      </StandardModal>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR<SolicitacoesPageProps>(async (context) => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const cookieHeader = context.req.headers.cookie || '';

  try {
    const requestsResponse = await fetch(`${baseUrl}/api/admin/requests?limit=100`, {
      headers: { Cookie: cookieHeader },
    });
    const requestsData = await requestsResponse.json();

    const statsResponse = await fetch(`${baseUrl}/api/admin/requests/stats`, {
      headers: { Cookie: cookieHeader },
    });
    const statsData = await statsResponse.json();

    return {
      props: {
        initialData: {
          requests: requestsData.data || [],
          stats: statsData.data || { total: 0, pending: 0, evaluation: 0, approved: 0, rejected: 0 },
        },
      },
    };
  } catch (error) {
    console.error('Error fetching requests for SSR:', error);
    return {
      props: {
        initialData: {
          requests: [],
          stats: { total: 0, pending: 0, evaluation: 0, approved: 0, rejected: 0 },
        },
      },
    };
  }
});

