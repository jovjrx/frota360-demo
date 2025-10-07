import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Select,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiUpload,
  FiFileText,
} from 'react-icons/fi';
import useSWR from 'swr';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';
import { getTranslation } from '@/lib/translations';

interface WeekOption {
  label: string;
  value: string;
  start: string;
  end: string;
}

interface DriverRecord {
  driverId: string;
  driverName: string;
  driverType: string;
  vehicle: string;
  weekStart: string;
  weekEnd: string;
  uberTotal: number;
  boltTotal: number;
  ganhosTotal: number;
  iva: number;
  ganhosMenosIva: number;
  despesasAdm: number;
  combustivel: number;
  portagens: number;
  aluguel: number;
  valorLiquido: number;
  iban: string;
  status: string;
}

interface WeeklyPageProps extends AdminPageProps {
  weekOptions: WeekOption[];
  currentWeek: string;
  initialRecords: DriverRecord[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WeeklyPage({ user, translations, locale, weekOptions, currentWeek, initialRecords }: WeeklyPageProps) {
  const [filterWeek, setFilterWeek] = useState(currentWeek);
  const [records, setRecords] = useState<DriverRecord[]>(initialRecords);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingResumos, setIsGeneratingResumos] = useState(false);
  const toast = useToast();

  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tAdmin = (key: string, variables?: Record<string, any>) => getTranslation(translations.page, key, variables) || key;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  const loadWeekData = async (weekValue: string) => {
    const selectedWeek = weekOptions.find(w => w.value === weekValue);
    if (!selectedWeek) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/weekly/process-week', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStart: selectedWeek.start,
          weekEnd: selectedWeek.end,
        }),
      });

      if (!response.ok) {
        throw new Error(tAdmin('error_loading_data'));
      }

      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: tAdmin('error_loading_data_title'),
        description: error instanceof Error ? error.message : tAdmin('error_loading_data_description'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (filterWeek) {
      loadWeekData(filterWeek);
    }
  }, [filterWeek]);

  const handleGenerateResumos = async () => {
    setIsGeneratingResumos(true);
    try {
      const selectedWeek = weekOptions.find(w => w.value === filterWeek);
      if (!selectedWeek) {
        toast({
          title: t('error_title'),
          description: tAdmin('select_week_error'),
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const response = await fetch('/api/admin/weekly/generate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStart: selectedWeek.start,
          weekEnd: selectedWeek.end,
          records, // Passar registros já processados
        }),
      });

      if (!response.ok) {
        throw new Error(tAdmin('error_generating_summaries'));
      }

      // Download do arquivo ZIP
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tAdmin('summaries_filename_prefix')}_${selectedWeek.start}_a_${selectedWeek.end}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: tAdmin('summaries_generated_success_title'),
        description: tAdmin('summaries_generated_success_description'),
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      console.error('Erro ao gerar resumos:', error);
      toast({
        title: tAdmin('error_generating_summaries_title'),
        description: error instanceof Error ? error.message : tAdmin('error_generating_summaries_description'),
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsGeneratingResumos(false);
    }
  };

  // Calcular totais
  const totals = records.reduce((acc, record) => ({
    ganhosTotal: acc.ganhosTotal + record.ganhosTotal,
    iva: acc.iva + record.iva,
    despesasAdm: acc.despesasAdm + record.despesasAdm,
    combustivel: acc.combustivel + record.combustivel,
    portagens: acc.portagens + record.portagens,
    aluguel: acc.aluguel + record.aluguel,
    valorLiquido: acc.valorLiquido + record.valorLiquido,
  }), {
    ganhosTotal: 0,
    iva: 0,
    despesasAdm: 0,
    combustivel: 0,
    portagens: 0,
    aluguel: 0,
    valorLiquido: 0,
  });

  return (
    <AdminLayout
      title={tAdmin('weekly_control_title')}
      subtitle={tAdmin('weekly_control_subtitle')}
      breadcrumbs={[{ label: tAdmin('weekly_control_title') }]}
    >
      <VStack spacing={6} align="stretch">
        {/* Alerta */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          {tAdmin('new_structure_alert')}
        </Alert>

        {/* Filtros e Ações */}
        <Card>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap" justify="space-between">
              <HStack spacing={4}>
                <Box>
                  <Text fontSize="sm" mb={2} fontWeight="medium">{tAdmin('week_label')}:</Text>
                  <Select 
                    value={filterWeek} 
                    onChange={(e) => setFilterWeek(e.target.value)} 
                    w="300px"
                  >
                    {weekOptions.map(week => (
                      <option key={week.value} value={week.value}>
                        {week.label}
                      </option>
                    ))}
                  </Select>
                </Box>
              </HStack>

              <HStack spacing={2}>
                <Button
                  leftIcon={<Icon as={FiUpload} />}
                  onClick={() => router.push('/admin/data')}
                  colorScheme="blue"
                  size="sm"
                >
                  {tAdmin('import_data_button')}
                </Button>
                <Button
                  leftIcon={<Icon as={FiRefreshCw} />}
                  onClick={() => loadWeekData(filterWeek)}
                  isLoading={isLoading}
                  size="sm"
                >
                  {t('update_button')}
                </Button>
                <Button
                  leftIcon={<Icon as={FiFileText} />}
                  onClick={handleGenerateResumos}
                  colorScheme="purple"
                  size="sm"
                  isLoading={isGeneratingResumos}
                  loadingText={tAdmin('generating_summaries_loading')}
                  isDisabled={records.length === 0}
                >
                  {tAdmin('generate_summaries_button')}
                </Button>
              </HStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Resumo */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tAdmin('total_earnings')}</StatLabel>
                <StatNumber fontSize="lg" color="green.600">{formatCurrency(totals.ganhosTotal)}</StatNumber>
                <StatHelpText fontSize="xs">{records.length} {tAdmin('drivers_label')}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tAdmin('total_discounts')}</StatLabel>
                <StatNumber fontSize="lg" color="red.600">
                  {formatCurrency(totals.iva + totals.despesasAdm + totals.combustivel + totals.portagens + totals.aluguel)}
                </StatNumber>
                <StatHelpText fontSize="xs">{tAdmin('iva_adm_fuel_tolls_rent')}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tAdmin('fuel_label')}</StatLabel>
                <StatNumber fontSize="lg" color="orange.600">{formatCurrency(totals.combustivel)}</StatNumber>
                <StatHelpText fontSize="xs">{tAdmin('prio_label')}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tAdmin('net_value')}</StatLabel>
                <StatNumber fontSize="lg" color="blue.600">{formatCurrency(totals.valorLiquido)}</StatNumber>
                <StatHelpText fontSize="xs">{tAdmin('total_to_pay')}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabela de Registros */}
        <Card>
          <CardHeader>
            <Heading size="md">{tAdmin('weekly_records_title')}</Heading>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <Box textAlign="center" py={10}>
                <Spinner size="xl" color="blue.500" />
                <Text mt={4} color="gray.600">{tAdmin('loading_data')}</Text>
              </Box>
            ) : records.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="gray.600">{tAdmin('no_records_found')}</Text>
                <Button
                  mt={4}
                  leftIcon={<Icon as={FiUpload} />}
                  onClick={() => router.push('/admin/data')}
                  colorScheme="blue"
                >
                  {tAdmin('import_data_button')}
                </Button>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>{t('driver')}</Th>
                      <Th>{t('type')}</Th>
                      <Th isNumeric>Uber</Th>
                      <Th isNumeric>Bolt</Th>
                      <Th isNumeric>{tAdmin('total_earnings')}</Th>
                      <Th isNumeric>{tAdmin('iva_short')}</Th>
                      <Th isNumeric>{tAdmin('adm_expenses_short')}</Th>
                      <Th isNumeric>{tAdmin('fuel_label')}</Th>
                      <Th isNumeric>{tAdmin('tolls_label')}</Th>
                      <Th isNumeric>{tAdmin('rent_label')}</Th>
                      <Th isNumeric>{tAdmin('net_value')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {records.map((record, index) => (
                      <Tr key={index}>
                        <Td>
                          <Text fontWeight="medium">{record.driverName}</Text>
                          <Text fontSize="xs" color="gray.600">{record.vehicle}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={record.driverType === 'renter' ? 'purple' : 'green'}>
                            {record.driverType === 'renter' ? t('type_renter') : t('type_affiliate')}
                          </Badge>
                        </Td>
                        <Td isNumeric>{formatCurrency(record.uberTotal)}</Td>
                        <Td isNumeric>{formatCurrency(record.boltTotal)}</Td>
                        <Td isNumeric fontWeight="bold">{formatCurrency(record.ganhosTotal)}</Td>
                        <Td isNumeric color="red.600">-{formatCurrency(record.iva)}</Td>
                        <Td isNumeric color="red.600">-{formatCurrency(record.despesasAdm)}</Td>
                        <Td isNumeric color="orange.600">-{formatCurrency(record.combustivel)}</Td>
                        <Td isNumeric color="orange.600">-{formatCurrency(record.portagens)}</Td>
                        <Td isNumeric color="purple.600">-{formatCurrency(record.aluguel)}</Td>
                        <Td isNumeric fontWeight="bold" color="blue.600">
                          {formatCurrency(record.valorLiquido)}
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
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async (context, user) => {
  const { req } = context;
  const cookie = req.headers.cookie || '';

  // Buscar semanas com dados reais
  const weeksResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/weekly/data-sources`, {
    headers: { Cookie: cookie },
  });
  const weeksData = await weeksResponse.json();
  const weekOptions: WeekOption[] = weeksData.data || [];

  let currentWeek = weekOptions.length > 0 ? weekOptions[0].value : '';
  let initialRecords: DriverRecord[] = [];

  if (currentWeek) {
    const selectedWeek = weekOptions[0];
    const recordsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/weekly/process-week`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        weekStart: selectedWeek.start,
        weekEnd: selectedWeek.end,
      }),
    });
    const recordsData = await recordsResponse.json();
    initialRecords = recordsData.records || [];
  }

  return {
    weekOptions,
    currentWeek,
    initialRecords,
  };
});

