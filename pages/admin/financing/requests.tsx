import { useState, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  Box,
  Heading,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Button,
  Text,
  useToast,
  Card,
  CardBody,
  HStack,
  Badge,
  Icon,
  useDisclosure,
} from '@chakra-ui/react';
import { FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import FinancingProofUpload from '@/components/admin/FinancingProofUpload';
import useSWR, { SWRConfig } from 'swr';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { formatDate } from '@/lib/utils/format';
import { getDrivers } from '@/lib/admin/adminQueries';
import { adminDb } from '@/lib/firebaseAdmin';
import { useRouter } from 'next/router';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Driver {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  status?: string;
}

interface FinancingRequestsPageProps extends AdminPageProps {
  initialDrivers: Driver[];
  initialRequests: any[];
}

function FinancingRequestsPageContent({
  user,
  locale,
  initialDrivers,
  initialRequests,
  tCommon,
  tPage,
  translations,
}: FinancingRequestsPageProps) {
  const router = useRouter();
  const toast = useToast();
  const { data, mutate } = useSWR('/api/admin/financing/requests', fetcher);
  const requests: any[] = data?.requests || initialRequests || [];

  const [interestValues, setInterestValues] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedFinancingId, setSelectedFinancingId] = useState<string | null>(null);
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();

  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const handleApprove = async (id: string) => {
    const val = interestValues[id];
    const weeklyInterest = val ? parseFloat(val) : 0;
    setLoadingId(id);
    try {
      const res = await fetch('/api/admin/financing/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action: 'approve', weeklyInterest }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro');
      toast({ 
        title: tc('success', 'Sucesso'), 
        description: 'Solicitação aprovada com sucesso!', 
        status: 'success',
        duration: 3000,
      });
      setInterestValues(prev => ({ ...prev, [id]: '' }));
      
      mutate();
      
      // Perguntar se quer anexar comprovante (opcional)
      if (json.financingId) {
        setTimeout(() => {
          if (window.confirm('Deseja anexar o comprovante de pagamento agora?')) {
            setSelectedFinancingId(json.financingId);
            onUploadOpen();
          }
        }, 500);
      }
    } catch (err: any) {
      toast({ 
        title: tc('error', 'Erro'), 
        description: err.message, 
        status: 'error' 
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch('/api/admin/financing/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action: 'reject' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro');
      toast({ 
        title: tc('success', 'Sucesso'), 
        description: 'Solicitação rejeitada', 
        status: 'success' 
      });
      mutate();
    } catch (err: any) {
      toast({ 
        title: tc('error', 'Erro'), 
        description: err.message, 
        status: 'error' 
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <AdminLayout
      title={t('financing.requests.title', 'Solicitações de Financiamento')}
      subtitle={t('financing.requests.subtitle', 'Aprovar ou rejeitar pedidos de empréstimo')}
      breadcrumbs={[
        { label: t('financing.title', 'Financiamentos'), href: '/admin/financing' },
        { label: t('financing.requests.title', 'Solicitações') }
      ]}
      translations={translations}
      side={
        <Button
          leftIcon={<Icon as={FiArrowLeft} />}
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/financing')}
        >
          {tc('back', 'Voltar')}
        </Button>
      }
    >
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <Heading size="sm" mb={4}>
              {t('financing.requests.pending', 'Solicitações Pendentes')}
              {requests.length > 0 && (
                <Badge ml={2} colorScheme="yellow">{requests.length}</Badge>
              )}
            </Heading>
            {requests.length === 0 ? (
              <Text color="gray.500">
                {t('financing.requests.empty', 'Nenhuma solicitação pendente.')}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>{t('financing.table.driver', 'Motorista')}</Th>
                      <Th>{t('financing.table.amount', 'Valor (€)')}</Th>
                      <Th>{t('financing.table.weeks', 'Semanas')}</Th>
                      <Th>{t('financing.table.date', 'Data')}</Th>
                      <Th>{t('financing.table.interest', 'Juros/sem (€)')}</Th>
                      <Th>{t('financing.table.actions', 'Ações')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {requests.map((req: any) => {
                      const driver = initialDrivers.find((d) => d.id === req.driverId);
                      const key = req.id;
                      return (
                        <Tr key={key}>
                          <Td>
                            <Text fontWeight="medium">
                              {driver ? (driver.fullName || driver.name) : req.driverId}
                            </Text>
                            {driver?.email && (
                              <Text fontSize="xs" color="gray.600">{driver.email}</Text>
                            )}
                          </Td>
                          <Td>
                            <Text fontWeight="semibold" color="green.600">
                              €{(req.amount ?? 0).toFixed(2)}
                            </Text>
                          </Td>
                          <Td>
                            <Badge colorScheme="blue">{req.weeks} {t('financing.weeks', 'semanas')}</Badge>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {formatDate(req.createdAt, '-')}
                            </Text>
                          </Td>
                          <Td>
                            <Input 
                              size="sm" 
                              type="number" 
                              step="0.01" 
                              value={interestValues[key] || ''} 
                              onChange={(e) => setInterestValues(prev => ({ ...prev, [key]: e.target.value }))} 
                              placeholder="0.00"
                              w="100px"
                            />
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button 
                                leftIcon={<Icon as={FiCheck} />}
                                colorScheme="green" 
                                size="sm"
                                onClick={() => handleApprove(key)}
                                isLoading={loadingId === key}
                              >
                                {tc('approve', 'Aprovar')}
                              </Button>
                              <Button 
                                leftIcon={<Icon as={FiX} />}
                                colorScheme="red" 
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(key)}
                                isLoading={loadingId === key}
                              >
                                {tc('reject', 'Rejeitar')}
                              </Button>
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>
      
      {/* Modal de Upload de Comprovante */}
      {selectedFinancingId && (
        <FinancingProofUpload
          isOpen={isUploadOpen}
          onClose={onUploadClose}
          financingId={selectedFinancingId}
          onUploadSuccess={() => {
            toast({
              title: 'Comprovante anexado!',
              status: 'success',
            });
          }}
        />
      )}
    </AdminLayout>
  );
}

export default function FinancingRequestsPage(props: FinancingRequestsPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/admin/financing/requests': { requests: props.initialRequests },
        },
      }}
    >
      <FinancingRequestsPageContent {...props} />
    </SWRConfig>
  );
}

// SSR com autenticação admin - Carrega TODOS os dados necessários
export const getServerSideProps = withAdminSSR(async (context, user) => {
  const drivers = await getDrivers();
  
  // Buscar solicitações pendentes direto do Firestore
  const snapshot = await adminDb
    .collection('financing_requests')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .get();
  const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    initialDrivers: drivers,
    initialRequests: requests,
  };
});
