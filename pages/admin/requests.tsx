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
import { getTranslation } from '@/lib/translations';

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

  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tAdmin = (key: string, variables?: Record<string, any>) => getTranslation(translations.page, key, variables) || key;

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
        throw new Error(tAdmin('operation_failed'));
      }

      toast({
        title: actionType === 'approve' ? tAdmin('request_approved_title') : 
               actionType === 'reject' ? tAdmin('request_rejected_title') : 
               tAdmin('status_updated_title'),
        status: 'success',
        duration: 3000,
      });

      mutate();
      onClose();
    } catch (error) {
      toast({
        title: t('error_title'),
        description: error instanceof Error ? error.message : tAdmin('operation_error_description'),
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
      pending: tAdmin('status_pending'),
      evaluation: tAdmin('status_evaluation'),
      approved: tAdmin('status_approved'),
      rejected: tAdmin('status_rejected'),
    };
    return labels[status] || status;
  };

  return (
    <AdminLayout
      title={tAdmin('requests_title')}
      subtitle={tAdmin('requests_subtitle')}
      breadcrumbs={[
        { label: tAdmin('requests_title') }
      ]}
    >
      <VStack spacing={6} align="stretch">
        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{t('total')}</StatLabel>
                <StatNumber>{data?.stats.total || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{tAdmin('status_pending')}</StatLabel>
                <StatNumber color="yellow.600">{data?.stats.pending || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{tAdmin('status_evaluation')}</StatLabel>
                <StatNumber color="blue.600">{data?.stats.evaluation || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{tAdmin('status_approved')}</StatLabel>
                <StatNumber color="green.600">{data?.stats.approved || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>{tAdmin('status_rejected')}</StatLabel>
                <StatNumber color="red.600">{data?.stats.rejected || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filtro */}
        <Card>
          <CardBody>
            <HStack>
              <Text fontWeight="medium">{tAdmin('filter_by_status')}:</Text>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                maxW="200px"
              >
                <option value="all">{t('all')}</option>
                <option value="pending">{tAdmin('status_pending')}</option>
                <option value="evaluation">{tAdmin('status_evaluation')}</option>
                <option value="approved">{tAdmin('status_approved')}</option>
                <option value="rejected">{tAdmin('status_rejected')}</option>
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
                        <HStack spacing={2}>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="xs"
                                colorScheme="blue"
                                onClick={() => handleAction(request, 'evaluation')}
                              >
                                {tAdmin('evaluate_button')}
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="green"
                                onClick={() => handleAction(request, 'approve')}
                              >
                                {tAdmin('approve_button')}
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="red"
                                onClick={() => handleAction(request, 'reject')}
                              >
                                {tAdmin('reject_button')}
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
                                {tAdmin('approve_button')}
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="red"
                                onClick={() => handleAction(request, 'reject')}
                              >
                                {tAdmin('reject_button')}
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
            {actionType === 'approve' ? tAdmin('approve_request_modal_title') :
             actionType === 'reject' ? tAdmin('reject_request_modal_title') :
             tAdmin('evaluate_request_modal_title')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                {selectedRequest?.fullName} ({selectedRequest?.email})
              </Text>
              
              {actionType === 'reject' && (
                <Textarea
                  placeholder={tAdmin('rejection_reason_placeholder')}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              )}
              
              {actionType !== 'reject' && (
                <Textarea
                  placeholder={tAdmin('notes_optional_placeholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button
              colorScheme={actionType === 'approve' ? 'green' : actionType === 'reject' ? 'red' : 'blue'}
              onClick={handleConfirmAction}
              isLoading={loading}
              isDisabled={actionType === 'reject' && !rejectionReason}
            >
              {t('confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}

// SSR com autenticação e dados iniciais
export const getServerSideProps = withAdminSSR(async (context, user) => {
  const requestsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/requests?limit=100`, {
    headers: { Cookie: context.req.headers.cookie || '' },
  });
  const requestsData = await requestsResponse.json();

  const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/requests/stats`, {
    headers: { Cookie: context.req.headers.cookie || '' },
  });
  const statsData = await statsResponse.json();

  return {
    initialData: {
      requests: requestsData.data || [],
      stats: statsData.data || { total: 0, pending: 0, evaluation: 0, approved: 0, rejected: 0 },
    },
  };
});

