import { useState, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useToast,
  Card,
  CardBody,
  Badge,
  Icon,
  IconButton,
  Tooltip,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
} from '@chakra-ui/react';
import { FiDollarSign, FiPlus, FiUpload, FiDownload, FiFileText, FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import FinancingProofUpload from '@/components/admin/FinancingProofUpload';
import FinancingModal from '@/components/admin/FinancingModal';
import useSWR, { SWRConfig } from 'swr';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
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

interface AdminFinancingPageProps extends AdminPageProps {
  initialDrivers: Driver[];
  initialFinancing: any[];
}

function AdminFinancingPageContent({
  user,
  locale,
  initialDrivers,
  initialFinancing,
  tCommon,
  tPage,
  translations,
}: AdminFinancingPageProps) {
  const router = useRouter();
  const toast = useToast();
  const { data, mutate } = useSWR('/api/admin/financing', fetcher);
  const financing: any[] = data?.financing || initialFinancing || [];
  
  // Buscar solicitações pendentes
  const { data: requestsData } = useSWR('/api/admin/financing/requests', fetcher);
  const requests: any[] = requestsData?.requests || [];

  const [loading, setLoading] = useState(false);
  const [selectedFinancingId, setSelectedFinancingId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);
  const [editingFinancing, setEditingFinancing] = useState<any | null>(null);

  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  // ✅ Calcular estatísticas
  const stats = useMemo(() => {
    const total = financing.length;
    const active = financing.filter(f => f.status === 'active').length;
    const completed = financing.filter(f => f.status === 'completed').length;
    const withProof = financing.filter(f => f.proofUrl).length;
    const withoutProof = total - withProof;
    
    const totalAmount = financing.reduce((sum, f) => sum + (f.amount || 0), 0);
    const activeAmount = financing
      .filter(f => f.status === 'active')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    
    const loans = financing.filter(f => f.type === 'loan').length;
    const discounts = financing.filter(f => f.type === 'discount').length;

    return {
      total,
      active,
      completed,
      withProof,
      withoutProof,
      totalAmount,
      activeAmount,
      loans,
      discounts,
    };
  }, [financing]);


  const handleAddFinancing = () => {
    setEditingFinancing(null);
    setIsFinancingModalOpen(true);
  };

  const handleEditFinancing = (financing: any) => {
    setEditingFinancing(financing);
    setIsFinancingModalOpen(true);
  };

  const handleCloseFinancingModal = () => {
    setIsFinancingModalOpen(false);
    setEditingFinancing(null);
  };

  const handleSaveFinancing = async (financingData: any) => {
    try {
      if (editingFinancing?.id) {
        // Modo edição - atualizar financiamento existente
        const response = await fetch(`/api/admin/financing/${editingFinancing.id}`, {
          method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(financingData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar financiamento');
        }

        toast({
          title: t('financing.updateSuccess', 'Financiamento atualizado'),
          status: 'success',
          duration: 2000,
        });
      } else {
        // Modo criação - criar novo financiamento
        const response = await fetch('/api/admin/financing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(financingData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar financiamento');
        }

        const result = await response.json();
        
        toast({
          title: t('financing.success.created', 'Financiamento criado!'),
          description: t('financing.success.createdDesc', 'O financiamento foi criado com sucesso.'),
          status: 'success',
          duration: 3000,
        });

        // Perguntar se quer anexar comprovante (opcional)
        if (result.id) {
          setTimeout(() => {
            if (window.confirm(t('financing.confirm.attachProof', 'Deseja anexar o comprovante de pagamento agora?'))) {
              setSelectedFinancingId(result.id);
              setIsUploadOpen(true);
            }
          }, 500);
        }

        return result; // Retorna para mostrar prompt de comprovante
      }

      mutate(); // Re-fetch financiamentos
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'loan' ? (
      <Badge colorScheme="blue">{t('financing.type.loan', 'Empréstimo')}</Badge>
    ) : (
      <Badge colorScheme="purple">{t('financing.type.discount', 'Desconto')}</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge colorScheme="green">{tc('status.active', 'Ativo')}</Badge>
    ) : (
      <Badge colorScheme="gray">{tc('status.completed', 'Completo')}</Badge>
    );
  };

  return (
    <AdminLayout
      title={t('financing.title', 'Financiamentos')}
      subtitle={t('financing.subtitle', 'Gerencie financiamentos e descontos dos motoristas')}
      breadcrumbs={[
        { label: t('financing.title', 'Financiamentos') }
      ]}
      translations={translations}
      side={
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="blue"
          size="sm"
          onClick={handleAddFinancing}
        >
          {t('financing.create.new', 'Novo Financiamento')}
        </Button>
      }
    >
      <VStack spacing={6} align="stretch">
        {/* ✅ Estatísticas */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiTrendingUp} mr={2} />
                    {t('financing.stats.total', 'Total')}
                  </StatLabel>
                  <StatNumber>{stats.total}</StatNumber>
                  <StatHelpText>{t('financing.stats.totalDesc', 'Financiamentos')}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiClock} mr={2} />
                    {t('financing.stats.active', 'Ativos')}
                  </StatLabel>
                  <StatNumber color="blue.500">{stats.active}</StatNumber>
                  <StatHelpText>€{stats.activeAmount.toFixed(2)}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiCheckCircle} mr={2} />
                    {t('financing.stats.completed', 'Completos')}
                  </StatLabel>
                  <StatNumber color="green.500">{stats.completed}</StatNumber>
                  <StatHelpText>{t('financing.stats.completedDesc', 'Finalizados')}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiFileText} mr={2} />
                    {t('financing.stats.withProof', 'Com Comprovante')}
                  </StatLabel>
                  <StatNumber color="purple.500">{stats.withProof}</StatNumber>
                  <StatHelpText>{t('financing.stats.withoutProof', 'Sem:')} {stats.withoutProof}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        <Divider />

        {/* ✅ Solicitações Pendentes (se houver) */}
        {requests.length > 0 && (
          <Card borderLeft="4px" borderLeftColor="orange.400">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" display="flex" alignItems="center">
                  <Icon as={FiAlertCircle} mr={2} color="orange.500" />
                  {t('financing.requests.title', 'Solicitações Pendentes')}
                  <Badge ml={2} colorScheme="orange">{requests.length}</Badge>
                </Heading>
                
                <Text color="gray.600" fontSize="sm">
                  {t('financing.requests.description', 'Motoristas que solicitaram financiamento e aguardam aprovação.')}
                </Text>

                <VStack spacing={3} align="stretch">
                  {requests.map((req: any) => {
                    const driver = initialDrivers.find((d) => d.id === req.driverId);
                    return (
                      <Box
                        key={req.id}
                        p={4}
                        bg="orange.50"
                        borderRadius="md"
                        borderWidth={1}
                        borderColor="orange.200"
                      >
                        <HStack justify="space-between" wrap="wrap">
                          <VStack align="start" spacing={1} flex="1">
                            <Text fontWeight="bold">{driver ? (driver.fullName || driver.name) : req.driverId}</Text>
                            <HStack spacing={2}>
                              <Badge colorScheme={req.type === 'loan' ? 'blue' : 'purple'}>
                                {req.type === 'loan' ? t('financing.type.loan', 'Empréstimo') : t('financing.type.discount', 'Desconto')}
                              </Badge>
                              <Text fontSize="sm" fontWeight="bold" color="orange.700">
                                €{(req.amount || 0).toFixed(2)}
                              </Text>
                              {req.weeks && <Text fontSize="sm" color="gray.600">{req.weeks} semanas</Text>}
                            </HStack>
                            {req.reason && (
                              <Text fontSize="sm" color="gray.600" mt={1}>
                                {req.reason}
                              </Text>
                            )}
                          </VStack>
                          
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              colorScheme="orange"
                              onClick={() => router.push('/admin/financing/requests')}
                            >
                              {t('financing.requests.review', 'Revisar')}
                            </Button>
                          </HStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* ✅ Financiamentos Existentes - Tabela Completa */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4} display="flex" alignItems="center">
              <Icon as={FiDollarSign} mr={2} />
              {t('financing.list.title', 'Financiamentos Existentes')}
            </Heading>
            
          {financing.length === 0 ? (
              <Text color="gray.500">{t('financing.list.empty', 'Nenhum financiamento encontrado.')}</Text>
          ) : (
              <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                      <Th>{t('financing.table.driver', 'Motorista')}</Th>
                      <Th>{t('financing.table.type', 'Tipo')}</Th>
                      <Th>{t('financing.table.amount', 'Valor (€)')}</Th>
                      <Th>{t('financing.table.weeks', 'Semanas')}</Th>
                      <Th>{t('financing.table.interest', 'Juros/sem (€)')}</Th>
                      <Th>{t('financing.table.remaining', 'Restante')}</Th>
                      <Th>{t('financing.table.start', 'Início')}</Th>
                      <Th>{t('financing.table.end', 'Fim')}</Th>
                      <Th>{t('financing.table.status', 'Status')}</Th>
                      <Th>{t('financing.table.proof', 'Comprovante')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {financing.map((fin) => {
                      const driver = initialDrivers.find((d) => d.id === fin.driverId);
                  return (
                    <Tr key={fin.id}>
                          <Td>{driver ? (driver.fullName || driver.name) : fin.driverId}</Td>
                          <Td>{getTypeBadge(fin.type)}</Td>
                      <Td>{(fin.amount ?? 0).toFixed(2)}</Td>
                      <Td>{fin.weeks ?? '-'}</Td>
                      <Td>{(fin.weeklyInterest ?? 0).toFixed(2)}</Td>
                      <Td>{typeof fin.remainingWeeks === 'number' ? fin.remainingWeeks : '-'}</Td>
                          <Td>{fin.startDate ? new Date(fin.startDate).toLocaleDateString(locale || 'pt-PT') : '-'}</Td>
                          <Td>{fin.endDate ? new Date(fin.endDate).toLocaleDateString(locale || 'pt-PT') : '-'}</Td>
                          <Td>{getStatusBadge(fin.status)}</Td>
                          <Td>
                            <HStack spacing={2}>
                              {fin.proofUrl ? (
                                <>
                                  <Tooltip label={t('financing.actions.downloadProof', 'Baixar comprovante')}>
                                    <IconButton
                                      aria-label={t('financing.actions.downloadProof', 'Baixar comprovante')}
                                      icon={<Icon as={FiDownload} />}
                                      size="sm"
                                      colorScheme="green"
                                      variant="ghost"
                                      as="a"
                                      href={fin.proofUrl}
                                      target="_blank"
                                    />
                                  </Tooltip>
                                  <Badge colorScheme="green" fontSize="xs">
                                    <Icon as={FiFileText} mr={1} />
                                    {t('financing.status.attached', 'Anexado')}
                                  </Badge>
                                </>
                              ) : (
                                <Tooltip label={t('financing.actions.attachProof', 'Anexar comprovante')}>
                                  <Button
                                    size="sm"
                                    leftIcon={<Icon as={FiUpload} />}
                                    colorScheme="blue"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedFinancingId(fin.id);
                                      setIsUploadOpen(true);
                                    }}
                                  >
                                    {t('financing.actions.attach', 'Anexar')}
                                  </Button>
                                </Tooltip>
                              )}
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
        onClose={() => setIsUploadOpen(false)}
          financingId={selectedFinancingId}
          onUploadSuccess={() => {
            mutate();
            toast({
              title: t('financing.success.proofAttached', 'Comprovante anexado!'),
              status: 'success',
            });
          }}
        />
      )}

      <FinancingModal
        isOpen={isFinancingModalOpen}
        onClose={handleCloseFinancingModal}
        financing={editingFinancing}
        drivers={initialDrivers}
        onSave={handleSaveFinancing}
        tCommon={tCommon}
        tPage={tPage}
      />
    </AdminLayout>
  );
}

export default function AdminFinancingPage(props: AdminFinancingPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/admin/financing': { financing: props.initialFinancing },
        },
      }}
    >
      <AdminFinancingPageContent {...props} />
    </SWRConfig>
  );
}

// SSR com autenticação admin - Carrega TODOS os dados necessários
export const getServerSideProps = withAdminSSR(async (context, user) => {
  const drivers = await getDrivers({ status: 'active' });
  
  // Buscar financiamentos direto do Firestore
  const snapshot = await adminDb
    .collection('financing')
    .orderBy('createdAt', 'desc')
    .get();
  const financing = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    initialDrivers: drivers,
    initialFinancing: financing,
  };
});
