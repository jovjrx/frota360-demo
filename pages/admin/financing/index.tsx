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
  Textarea,
  useDisclosure,
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

  const [driverId, setDriverId] = useState('');
  const [type, setType] = useState('loan');
  const [amount, setAmount] = useState('');
  const [weeks, setWeeks] = useState('');
  const [weeklyInterest, setWeeklyInterest] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFinancingId, setSelectedFinancingId] = useState<string | null>(null);
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) {
      toast({ title: tc('error', 'Erro'), description: t('financing.errors.selectDriver', 'Selecione o motorista'), status: 'error' });
      return;
    }
    const parsedAmount = parseFloat(amount) || 0;
    const parsedWeeks = weeks ? parseInt(weeks, 10) : null;
    const parsedInterest = weeklyInterest ? parseFloat(weeklyInterest) : 0;
    if (type === 'loan' && (!parsedWeeks || parsedWeeks <= 0)) {
      toast({ title: tc('error', 'Erro'), description: t('financing.errors.weeksRequired', 'Informe o número de semanas'), status: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/financing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          driverId, 
          type, 
          amount: parsedAmount, 
          weeks: parsedWeeks, 
          weeklyInterest: parsedInterest,
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro');
      
      toast({ 
        title: tc('success', 'Sucesso'), 
        description: t('financing.success.created', 'Financiamento criado com sucesso!'), 
        status: 'success',
        duration: 3000,
      });
      
      setDriverId('');
      setAmount('');
      setWeeks('');
      setWeeklyInterest('');
      setNotes('');
      
      mutate();
      
      // Perguntar se quer anexar comprovante (opcional)
      if (json.id) {
        setTimeout(() => {
          if (window.confirm(t('financing.confirm.attachProof', 'Deseja anexar o comprovante de pagamento agora?'))) {
            setSelectedFinancingId(json.id);
            onUploadOpen();
          }
        }, 500);
      }
    } catch (err: any) {
      toast({ title: tc('error', 'Erro'), description: err.message, status: 'error' });
    } finally {
      setLoading(false);
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
        <HStack spacing={3}>
          <Button
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="blue"
            size="sm"
            onClick={() => {
              // Scroll para o formulário
              document.getElementById('create-financing-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('financing.create.new', 'Novo Financiamento')}
          </Button>
          <Button
            leftIcon={<Icon as={FiAlertCircle} />}
            colorScheme="orange"
            size="sm"
            variant="outline"
            onClick={() => router.push('/admin/financing/requests')}
          >
            {t('financing.viewRequests', 'Ver Solicitações')}
          </Button>
        </HStack>
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

        {/* ✅ Layout em duas colunas */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          {/* Coluna Esquerda: Criar Financiamento */}
          <GridItem>
            <Card>
              <CardBody>
                <Box as="form" onSubmit={handleSubmit} id="create-financing-form">
                  <Heading size="sm" mb={4} display="flex" alignItems="center">
                    <Icon as={FiPlus} mr={2} />
                    {t('financing.create.title', 'Criar Financiamento')}
                  </Heading>
                  
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>{t('financing.form.driver', 'Motorista')}</FormLabel>
                      <Select placeholder={tc('select', 'Selecione')} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                        {initialDrivers.map((d) => (
                          <option key={d.id} value={d.id}>{d.fullName || d.name}</option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <HStack spacing={4}>
                      <FormControl isRequired flex="1">
                        <FormLabel>{t('financing.form.type', 'Tipo')}</FormLabel>
                        <Select value={type} onChange={(e) => setType(e.target.value)}>
                          <option value="loan">{t('financing.type.loan', 'Empréstimo')}</option>
                          <option value="discount">{t('financing.type.discount', 'Desconto')}</option>
                        </Select>
                      </FormControl>
                      
                      <FormControl isRequired flex="1">
                        <FormLabel>{t('financing.form.amount', 'Valor (€)')}</FormLabel>
                        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                      </FormControl>
                    </HStack>
                    
                    {type === 'loan' && (
                      <HStack spacing={4}>
                        <FormControl isRequired flex="1">
                          <FormLabel>{t('financing.form.weeks', 'Semanas')}</FormLabel>
                          <Input type="number" value={weeks} onChange={(e) => setWeeks(e.target.value)} />
                        </FormControl>
                        
                        <FormControl flex="1">
                          <FormLabel>{t('financing.form.interest', 'Juros/sem (€)')}</FormLabel>
                          <Input type="number" step="0.01" value={weeklyInterest} onChange={(e) => setWeeklyInterest(e.target.value)} />
                        </FormControl>
                      </HStack>
                    )}
                    
                    <FormControl>
                      <FormLabel>{t('financing.form.notes', 'Observações (opcional)')}</FormLabel>
                      <Textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('financing.form.notesPlaceholder', 'Informações adicionais...')}
                        rows={3}
                      />
                    </FormControl>
                    
                    <Button type="submit" colorScheme="blue" isLoading={loading} size="lg">
                      {tc('create', 'Criar')}
                    </Button>
                  </VStack>
                </Box>
              </CardBody>
            </Card>
          </GridItem>

          {/* Coluna Direita: Solicitações Pendentes */}
          <GridItem>
            <Card>
              <CardBody>
                <Heading size="sm" mb={4} display="flex" alignItems="center">
                  <Icon as={FiAlertCircle} mr={2} />
                  {t('financing.requests.title', 'Solicitações Pendentes')}
                </Heading>
                
                <VStack spacing={3} align="stretch">
                  <Text color="gray.600" fontSize="sm">
                    {t('financing.requests.description', 'Motoristas que solicitaram financiamento e aguardam aprovação.')}
                  </Text>
                  
                  <Button
                    leftIcon={<Icon as={FiAlertCircle} />}
                    colorScheme="orange"
                    variant="outline"
                    onClick={() => router.push('/admin/financing/requests')}
                  >
                    {t('financing.requests.viewAll', 'Ver Todas as Solicitações')}
                  </Button>
                  
                  <Box p={4} bg="orange.50" borderRadius="md" borderLeft="4px" borderLeftColor="orange.400">
                    <Text fontSize="sm" color="orange.700">
                      {t('financing.requests.reminder', 'Lembre-se de revisar e aprovar/rejeitar as solicitações pendentes para manter o fluxo ativo.')}
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

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
                                      onUploadOpen();
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
          onClose={onUploadClose}
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
