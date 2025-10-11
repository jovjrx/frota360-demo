import { useState, useMemo } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Link,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import { FiDollarSign, FiSend, FiClock, FiCheckCircle, FiDownload, FiFileText } from 'react-icons/fi';
import useSWR, { SWRConfig } from 'swr';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { adminDb } from '@/lib/firebaseAdmin';
import { getDriverData } from '@/lib/auth/driverData';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface DriverFinancingPageProps extends DashboardPageProps {
  motorista: {
    id: string;
    fullName: string;
    email: string;
  };
  initialFinancings: any[];
}

function DriverFinancingPageContent({
  motorista,
  locale,
  tCommon,
  tPage,
  translations,
  initialFinancings,
}: DriverFinancingPageProps) {
  const toast = useToast();
  const { data, mutate } = useSWR('/api/dashboard/financing', fetcher);
  const financings: any[] = data?.financings || initialFinancings || [];

  const [amount, setAmount] = useState('');
  const [weeks, setWeeks] = useState('');
  const [loading, setLoading] = useState(false);

  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    const parsedWeeks = parseInt(weeks, 10);
    if (!parsedAmount || parsedAmount <= 0 || !parsedWeeks || parsedWeeks <= 0) {
      toast({ 
        title: tc('error', 'Erro'), 
        description: 'Preencha valor e semanas corretamente', 
        status: 'error' 
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/driver/financing/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount, weeks: parsedWeeks }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro');
      toast({ 
        title: tc('success', 'Sucesso'), 
        description: 'Solicitação enviada com sucesso', 
        status: 'success' 
      });
      setAmount('');
      setWeeks('');
      mutate();
    } catch (err: any) {
      toast({ 
        title: tc('error', 'Erro'), 
        description: err.message, 
        status: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const activeFinancings = financings.filter(f => f.status === 'active');
  const totalActive = activeFinancings.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalWeeklyDeduction = activeFinancings.reduce((sum, f) => {
    const weeklyAmount = f.type === 'loan' && f.weeks ? f.amount / f.weeks : f.amount;
    return sum + weeklyAmount + (f.weeklyInterest || 0);
  }, 0);

  const getTypeBadge = (type: string) => {
    return type === 'loan' ? (
      <Badge colorScheme="blue">Empréstimo</Badge>
    ) : (
      <Badge colorScheme="purple">Desconto</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge colorScheme="green">
        <Icon as={FiCheckCircle} mr={1} />
        Ativo
      </Badge>
    ) : (
      <Badge colorScheme="gray">Completo</Badge>
    );
  };

  return (
    <>
      <Head>
        <title>Financiamentos - Conduz.pt</title>
      </Head>
      
      <DashboardLayout
        title={t('financing.title', 'Financiamentos')}
        subtitle={t('financing.subtitle', 'Solicite um financiamento e veja seus empréstimos ativos')}
        breadcrumbs={[
          { label: t('financing.title', 'Financiamentos') }
        ]}
        translations={translations}
      >
        <VStack spacing={6} align="stretch">
          {/* Estatísticas */}
          {activeFinancings.length > 0 && (
            <HStack spacing={4} wrap="wrap">
              <Card flex="1" minW="200px">
                <CardBody>
                  <Stat>
                    <StatLabel>Total Ativo</StatLabel>
                    <StatNumber color="blue.600">€{totalActive.toFixed(2)}</StatNumber>
                    <StatHelpText>
                      {activeFinancings.length} financiamento{activeFinancings.length > 1 ? 's' : ''}
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card flex="1" minW="200px">
                <CardBody>
                  <Stat>
                    <StatLabel>Desconto Semanal</StatLabel>
                    <StatNumber color="orange.600">€{totalWeeklyDeduction.toFixed(2)}</StatNumber>
                    <StatHelpText>Valor descontado por semana</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </HStack>
          )}

          {/* Formulário de Solicitação */}
          <Card>
            <CardBody>
              <Box as="form" onSubmit={handleSubmit}>
                <Heading size="sm" mb={4}>
                  <Icon as={FiSend} mr={2} />
                  {t('financing.request.title', 'Solicitar Financiamento')}
                </Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  {t('financing.request.description', 'Preencha os dados abaixo para solicitar um empréstimo. Sua solicitação será analisada pela administração.')}
                </Text>
                <HStack spacing={4} align="flex-end">
                  <FormControl isRequired flex="1">
                    <FormLabel>{t('financing.form.amount', 'Valor (€)')}</FormLabel>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormControl isRequired flex="1">
                    <FormLabel>{t('financing.form.weeks', 'Semanas')}</FormLabel>
                    <Input 
                      type="number" 
                      value={weeks} 
                      onChange={(e) => setWeeks(e.target.value)}
                      placeholder="12"
                    />
                  </FormControl>
                  <Button 
                    type="submit" 
                    colorScheme="green" 
                    isLoading={loading}
                    leftIcon={<Icon as={FiSend} />}
                  >
                    {tc('send', 'Enviar')}
                  </Button>
                </HStack>
              </Box>
            </CardBody>
          </Card>

          {/* Lista de Financiamentos */}
          <Card>
            <CardBody>
              <Heading size="sm" mb={4}>
                <Icon as={FiDollarSign} mr={2} />
                {t('financing.list.title', 'Meus Financiamentos')}
              </Heading>
              {financings.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Icon as={FiClock} boxSize={12} color="gray.300" mb={3} />
                  <Text color="gray.500">
                    {t('financing.list.empty', 'Nenhum financiamento encontrado.')}
                  </Text>
                  <Text fontSize="sm" color="gray.400" mt={1}>
                    {t('financing.list.emptyHint', 'Solicite um financiamento usando o formulário acima.')}
                  </Text>
                </Box>
              ) : (
                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>{t('financing.table.type', 'Tipo')}</Th>
                        <Th>{t('financing.table.amount', 'Valor (€)')}</Th>
                        <Th>{t('financing.table.weeks', 'Semanas')}</Th>
                        <Th>{t('financing.table.weeklyPayment', 'Pagamento/semana')}</Th>
                        <Th>{t('financing.table.interest', 'Juros/sem (€)')}</Th>
                        <Th>{t('financing.table.start', 'Início')}</Th>
                        <Th>{t('financing.table.end', 'Fim')}</Th>
                        <Th>{t('financing.table.status', 'Status')}</Th>
                        {/* Só mostra coluna de comprovante se houver pelo menos um */}
                        {financings.some(f => f.proofUrl) && (
                          <Th>{t('financing.table.proof', 'Comprovante')}</Th>
                        )}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {financings.map((fin) => {
                        const weeklyPayment = fin.type === 'loan' && fin.weeks ? 
                          (fin.amount / fin.weeks) : fin.amount;
                        const totalWeekly = weeklyPayment + (fin.weeklyInterest || 0);
                        const hasAnyProof = financings.some(f => f.proofUrl);
                        
                        return (
                          <Tr key={fin.id}>
                            <Td>{getTypeBadge(fin.type)}</Td>
                            <Td fontWeight="semibold">€{(fin.amount ?? 0).toFixed(2)}</Td>
                            <Td>
                              {fin.weeks ? (
                                <Badge colorScheme="blue">
                                  {fin.remainingWeeks ?? fin.weeks}/{fin.weeks}
                                </Badge>
                              ) : '-'}
                            </Td>
                            <Td fontWeight="semibold" color="orange.600">
                              €{totalWeekly.toFixed(2)}
                            </Td>
                            <Td>€{(fin.weeklyInterest ?? 0).toFixed(2)}</Td>
                            <Td>{fin.startDate ? new Date(fin.startDate).toLocaleDateString(locale || 'pt-PT') : '-'}</Td>
                            <Td>{fin.endDate ? new Date(fin.endDate).toLocaleDateString(locale || 'pt-PT') : '-'}</Td>
                            <Td>{getStatusBadge(fin.status)}</Td>
                            {/* Só mostra célula de comprovante se houver pelo menos um na lista */}
                            {hasAnyProof && (
                              <Td>
                                {fin.proofUrl ? (
                                  <HStack spacing={2}>
                                    <Tooltip label="Baixar comprovante">
                                      <IconButton
                                        aria-label="Baixar comprovante"
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
                                      Anexado
                                    </Badge>
                                  </HStack>
                                ) : (
                                  <Text fontSize="sm" color="gray.400">-</Text>
                                )}
                              </Td>
                            )}
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
      </DashboardLayout>
    </>
  );
}

export default function DriverFinancingPage(props: DriverFinancingPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/dashboard/financing': { financings: props.initialFinancings },
        },
      }}
    >
      <DriverFinancingPageContent {...props} />
    </SWRConfig>
  );
}

// SSR com autenticação do motorista - Carrega TODOS os dados necessários
export const getServerSideProps = withDashboardSSR(
  { loadDriverData: true },
  async (context, user, driverId) => {
    // Buscar dados do motorista e financiamentos
    const driver = await getDriverData(driverId);
    let financings: any[] = [];
    
    if (driver && driver.id) {
      const snapshot = await adminDb
        .collection('financing')
        .where('driverId', '==', driver.id)
        .orderBy('createdAt', 'desc')
        .get();
      financings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    return {
      initialFinancings: financings,
    };
  }
);
