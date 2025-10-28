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
import { FiDollarSign, FiSend, FiClock, FiCheckCircle, FiDownload, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { Grid, GridItem, Divider } from '@chakra-ui/react';
import useSWR, { SWRConfig } from 'swr';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import { formatDate } from '@/lib/utils/format';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { adminDb } from '@/lib/firebaseAdmin';
import { getDriverData } from '@/lib/auth/driverData';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';

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
  const financings: any[] = data?.financings || [];

  // Debug logs
  console.log('🎨 [Dashboard Financing] Rendering...');
  console.log('📦 [Dashboard Financing] initialFinancings (SSR):', initialFinancings?.length || 0);
  console.log('📡 [Dashboard Financing] SWR data:', data);
  console.log('💰 [Dashboard Financing] financings (final):', financings?.length || 0);

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
  
  // Desconto semanal = apenas a parcela/desconto fixo
  // Juros são aplicados sobre os ganhos, não sobre o valor do financiamento
  const totalWeeklyDeduction = activeFinancings.reduce((sum, f) => {
    if (f.type === 'loan' && f.weeks && f.weeks > 0) {
      // Empréstimo: parcela semanal (principal)
      return sum + (f.amount / f.weeks);
    } else {
      // Desconto: valor fixo por semana
      return sum + (f.amount || 0);
    }
  }, 0);
  
  // Total de juros percentual (aplicado sobre ganhos)
  const totalInterestPercent = activeFinancings.reduce((sum, f) => {
    return sum + (f.weeklyInterest || 0);
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
        <title>Financiamentos - Frota360.pt</title>
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
                  <StatLabel>Desconto Semanal (Fixo)</StatLabel>
                  <StatNumber color="orange.600">€{totalWeeklyDeduction.toFixed(2)}</StatNumber>
                  <StatHelpText>Parcelas + descontos fixos</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            {totalInterestPercent > 0 && (
              <Card flex="1" minW="200px">
                <CardBody>
                  <Stat>
                    <StatLabel>Taxa Adicional (Juros)</StatLabel>
                    <StatNumber color="red.600">+{totalInterestPercent.toFixed(1)}%</StatNumber>
                    <StatHelpText>Aplicado sobre seus ganhos</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            )}
          </HStack>

          <Divider />

          {/* Layout em 2 colunas: Meus Financiamentos | Solicitar Novo */}
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
            {/* Coluna Esquerda: Meus Financiamentos Ativos */}
            <GridItem>
              <Card>
                <CardBody>
                  <Heading size="sm" mb={4} display="flex" alignItems="center">
                    <Icon as={FiDollarSign} mr={2} />
                    {t('financing.list.title', 'Meus Financiamentos Ativos')}
                  </Heading>
                  
                  <Box maxH="600px" overflowY="auto">
                    {activeFinancings.length === 0 ? (
                      <VStack spacing={2} align="center" py={8}>
                        <Icon as={FiClock} fontSize="3xl" color="gray.400" />
                        <Text color="gray.600" fontWeight="semibold">
                          {t('financing.list.empty', 'Nenhum financiamento ativo')}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {t('financing.list.emptyDesc', 'Solicite um financiamento ao lado')}
                        </Text>
                      </VStack>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {activeFinancings.map((fin) => (
                          <Box
                            key={fin.id}
                            p={3}
                            bg="white"
                            borderWidth={1}
                            borderRadius="md"
                            borderColor="gray.200"
                          >
                            <VStack align="start" spacing={2} w="full">
                              <HStack justify="space-between" w="full">
                                <VStack align="start" spacing={0}>
                                  <Badge colorScheme={fin.type === 'loan' ? 'blue' : 'purple'}>
                                    {fin.type === 'loan' ? t('financing.type.loan', 'Empréstimo') : t('financing.type.discount', 'Desconto')}
                                  </Badge>
                                  <Badge colorScheme="green" mt={1}>
                                    <Icon as={FiCheckCircle} mr={1} />
                                    {t('financing.status.active', 'Ativo')}
                                  </Badge>
                                </VStack>
                                <VStack align="end" spacing={0}>
                                  <Text fontWeight="bold" color="blue.600" fontSize="lg">
                                    €{(fin.amount || 0).toFixed(2)}
                                  </Text>
                                  {fin.weeklyInterest > 0 && (
                                    <Text fontSize="xs" color="orange.600">+{fin.weeklyInterest}% juros</Text>
                                  )}
                                </VStack>
                              </HStack>
                              
                              {/* Barra de progresso para empréstimos */}
                              {fin.weeks && fin.type === 'loan' && (
                                <VStack align="stretch" spacing={1} w="full">
                                  <HStack justify="space-between" fontSize="xs" color="gray.600">
                                    <Text>{fin.weeks - (fin.remainingWeeks || 0)} / {fin.weeks} semanas pagas</Text>
                                    <Text fontWeight="bold">{fin.remainingWeeks || 0} restantes</Text>
                                  </HStack>
                                  <Box w="full" h="6px" bg="gray.200" borderRadius="full" overflow="hidden">
                                    <Box
                                      h="full"
                                      bg={fin.remainingWeeks === 0 ? 'green.400' : 'blue.400'}
                                      w={`${((fin.weeks - (fin.remainingWeeks || 0)) / fin.weeks) * 100}%`}
                                      transition="width 0.3s"
                                    />
                                  </Box>
                                  <HStack justify="space-between" fontSize="xs">
                                    <Text color="gray.600">
                                      Parcela: €{(fin.amount / fin.weeks).toFixed(2)}/sem
                                    </Text>
                                    {fin.proofUrl && (
                                      <HStack spacing={1} color="green.600">
                                        <Icon as={FiCheckCircle} boxSize={3} />
                                        <Text>Comprovante</Text>
                                      </HStack>
                                    )}
                                  </HStack>
                                </VStack>
                              )}
                              
                              {/* Para descontos */}
                              {fin.type === 'discount' && (
                                <HStack w="full" justify="space-between" fontSize="xs">
                                  <Text color="gray.600">
                                    Desconto semanal de €{(fin.amount || 0).toFixed(2)}
                                  </Text>
                                  {fin.proofUrl && (
                                    <HStack spacing={1} color="green.600">
                                      <Icon as={FiCheckCircle} boxSize={3} />
                                      <Text>Comprovante</Text>
                                    </HStack>
                                  )}
                                </HStack>
                              )}
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </Box>
                </CardBody>
              </Card>
            </GridItem>

            {/* Coluna Direita: Solicitar Novo Financiamento */}
            <GridItem>
              <Card borderLeft="4px" borderLeftColor="green.400">
                <CardBody>
                  <Heading size="sm" mb={4} display="flex" alignItems="center">
                    <Icon as={FiSend} mr={2} color="green.500" />
                    {t('financing.request.title', 'Solicitar Financiamento')}
                  </Heading>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    {t('financing.request.description', 'Preencha os dados abaixo para solicitar um empréstimo.')}
                  </Text>
                  <Box as="form" onSubmit={handleSubmit}>
                    <VStack spacing={4}>
            <FormControl isRequired>
                        <FormLabel>{t('financing.form.amount', 'Valor (€)')}</FormLabel>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={amount} 
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          size="lg"
                        />
            </FormControl>
            <FormControl isRequired>
                        <FormLabel>{t('financing.form.weeks', 'Número de Semanas')}</FormLabel>
                        <Input 
                          type="number" 
                          value={weeks} 
                          onChange={(e) => setWeeks(e.target.value)}
                          placeholder="12"
                          size="lg"
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          O valor será dividido em parcelas semanais
                        </Text>
            </FormControl>
                      
                      {amount && weeks && parseFloat(amount) > 0 && parseInt(weeks) > 0 && (
                        <Box w="full" p={3} bg="blue.50" borderRadius="md">
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="bold" color="blue.800">
                              Resumo da Solicitação:
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              Valor total: <strong>€{parseFloat(amount).toFixed(2)}</strong>
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              Parcela semanal: <strong>€{(parseFloat(amount) / parseInt(weeks)).toFixed(2)}</strong>
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              Duração: <strong>{weeks} semanas</strong>
                            </Text>
                          </VStack>
                        </Box>
                      )}
                      
                      <Button 
                        type="submit" 
                        colorScheme="green" 
                        isLoading={loading}
                        leftIcon={<Icon as={FiSend} />}
                        size="lg"
                        w="full"
                      >
                        {tc('send', 'Enviar Solicitação')}
                      </Button>
                      
                      <Box p={3} bg="orange.50" borderRadius="md" w="full">
                        <HStack align="start">
                          <Icon as={FiAlertCircle} color="orange.500" mt={1} />
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color="orange.800" fontWeight="semibold">
                              Importante:
                            </Text>
                            <Text fontSize="xs" color="gray.700">
                              Sua solicitação será analisada pela administração. Você receberá uma resposta em breve.
                            </Text>
                          </VStack>
          </HStack>
        </Box>
                    </VStack>
                  </Box>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>

          {/* Histórico Completo (Tabela) */}
          {financings.length > 0 && (
            <>
              <Divider />
              <Card>
            <CardBody>
              <Heading size="sm" mb={4}>
                <Icon as={FiDollarSign} mr={2} />
                {t('financing.list.title', 'Meus Financiamentos')}
              </Heading>
                <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                        <Th>{t('financing.table.type', 'Tipo')}</Th>
                        <Th>{t('financing.table.amount', 'Valor Total (€)')}</Th>
                        <Th>{t('financing.table.weeks', 'Progresso')}</Th>
                        <Th>{t('financing.table.weeklyPayment', 'Desconto Fixo/sem')}</Th>
                        <Th>{t('financing.table.interest', 'Taxa Adicional')}</Th>
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
                        // Desconto fixo semanal (parcela ou valor fixo)
                        const weeklyPayment = fin.type === 'loan' && fin.weeks && fin.weeks > 0 ? 
                          (fin.amount / fin.weeks) : (fin.amount || 0);
                        
                        const hasAnyProof = financings.some(f => f.proofUrl);
                        
                        return (
                  <Tr key={fin.id}>
                            <Td>{getTypeBadge(fin.type)}</Td>
                            <Td fontWeight="semibold">€{(fin.amount ?? 0).toFixed(2)}</Td>
                            <Td>
                              {fin.weeks ? (
                                <VStack align="start" spacing={0}>
                                  <Badge colorScheme="blue">
                                    {fin.weeks - (fin.remainingWeeks || 0)}/{fin.weeks} pagas
                                  </Badge>
                                  <Text fontSize="xs" color="gray.600">
                                    {fin.remainingWeeks || 0} restantes
                                  </Text>
                                </VStack>
                              ) : '-'}
                            </Td>
                            <Td fontWeight="semibold" color="orange.600">
                              €{weeklyPayment.toFixed(2)}
                            </Td>
                            <Td>
                              {fin.weeklyInterest > 0 ? (
                                <Badge colorScheme="red">+{fin.weeklyInterest}%</Badge>
                              ) : (
                                <Text color="gray.400">-</Text>
                              )}
                            </Td>
                            <Td>{formatDate(fin.startDate, '-')}</Td>
                            <Td>{formatDate(fin.endDate, '-')}</Td>
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
              </CardBody>
            </Card>
            </>
          )}
      </VStack>
    </DashboardLayout>
    </>
  );
}

export default function DriverFinancingPage(props: DriverFinancingPageProps) {
  console.log('🚀 [SWRConfig] Initializing with fallback:', {
    key: '/api/dashboard/financing',
    initialFinancings: props.initialFinancings?.length || 0,
    fallback: { success: true, financings: props.initialFinancings?.length || 0 }
  });
  
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/dashboard/financing': { success: true, financings: props.initialFinancings },
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
    
    // Serializar todos os Timestamps de forma centralizada
    const initialData = serializeDatasets({
      initialFinancings: financings,
    });
    
    return initialData;
  }
);

