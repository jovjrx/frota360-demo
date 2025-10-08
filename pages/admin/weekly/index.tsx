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
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { getTranslation } from '@/lib/translations';
import { getWeekOptions } from '@/lib/admin/adminQueries';
import { useRouter } from 'next/router';
import { getWeekId, getWeekDates } from '@/lib/utils/date-helpers';

interface WeekOption {
  label: string;
  value: string;
  start: string;
  end: string;
}

import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';

interface DriverRecord extends DriverWeeklyRecord {
  driverType: 'affiliate' | 'renter';
  vehicle: string;
  platformData: WeeklyNormalizedData[];
}

interface WeeklyPageProps extends AdminPageProps {
  weekOptions: WeekOption[];
  currentWeek: string;
  initialRecords: DriverRecord[];
}

export default function WeeklyPage({ user, translations, locale, weekOptions, currentWeek, initialRecords }: WeeklyPageProps) {
  const [filterWeek, setFilterWeek] = useState(currentWeek);
  const [records, setRecords] = useState<DriverRecord[]>(initialRecords);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingResumos, setIsGeneratingResumos] = useState(false);
  const [unassigned, setUnassigned] = useState<WeeklyNormalizedData[]>([]);
  const toast = useToast();
  const router = useRouter();

  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tAdmin = (key: string, variables?: Record<string, any>) => getTranslation(translations.admin, key, variables) || key;
  const translateAdmin = (key: string, fallback: string) => {
    const value = tAdmin(key);
    return value === key ? fallback : value;
  };

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
      const response = await fetch(`/api/admin/weekly/data?weekId=${selectedWeek.value}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(tAdmin('error_loading_data'));
      }

      const data = await response.json();

      const recordsResponse: DriverRecord[] = (data.records || []).map((record: DriverRecord) => ({
        ...record,
        driverType: record.driverType,
        vehicle: record.vehicle,
        platformData: record.platformData || [],
      }));

      setRecords(recordsResponse);
      setUnassigned(data.unassigned || []);
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
    ivaValor: acc.ivaValor + record.ivaValor,
    despesasAdm: acc.despesasAdm + record.despesasAdm,
    combustivel: acc.combustivel + record.combustivel,
    viaverde: acc.viaverde + record.viaverde,
    aluguel: acc.aluguel + record.aluguel,
    repasse: acc.repasse + record.repasse,
  }), {
    ganhosTotal: 0,
    ivaValor: 0,
    despesasAdm: 0,
    combustivel: 0,
    viaverde: 0,
    aluguel: 0,
    repasse: 0,
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
                  {formatCurrency(totals.ivaValor + totals.despesasAdm + totals.combustivel + totals.viaverde + totals.aluguel)}
                </StatNumber>
                <StatHelpText fontSize="xs">{tAdmin("iva_adm_fuel_tolls_rent")}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tAdmin("fuel_label")}</StatLabel>
                <StatNumber fontSize="lg" color="orange.600">{formatCurrency(totals.combustivel)}</StatNumber>
                <StatHelpText fontSize="xs">{tAdmin("prio_label")}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tAdmin("net_value")}</StatLabel>
                <StatNumber fontSize="lg" color="blue.600">{formatCurrency(totals.repasse)}</StatNumber>
                <StatHelpText fontSize="xs">{tAdmin("total_to_pay")}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabela de Registros */}
        <Card>
          <CardHeader>
            <Heading size="md">{tAdmin("weekly_records_title")}</Heading>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <Box textAlign="center" py={10}>
                <Spinner size="xl" color="blue.500" />
                <Text mt={4} color="gray.600">{tAdmin("loading_data")}</Text>
              </Box>
            ) : records.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="gray.600">{tAdmin("no_records_found")}</Text>
                <Button
                  mt={4}
                  leftIcon={<Icon as={FiUpload} />}
                  onClick={() => router.push("/admin/data")}
                  colorScheme="blue"
                >
                  {tAdmin("import_data_button")}
                </Button>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>{t("driver")}</Th>
                      <Th>{t("type")}</Th>
                      <Th isNumeric>Uber</Th>
                      <Th isNumeric>Bolt</Th>
                      <Th isNumeric>{tAdmin("total_earnings")}</Th>
                      <Th isNumeric>{tAdmin("iva_short")}</Th>
                      <Th isNumeric>{tAdmin("adm_expenses_short")}</Th>
                      <Th isNumeric>{tAdmin("fuel_label")}</Th>
                      <Th isNumeric>{tAdmin("tolls_label")}</Th>
                      <Th isNumeric>{tAdmin("rent_label")}</Th>
                      <Th isNumeric>{tAdmin("net_value")}</Th>
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
                          <Badge colorScheme={record.driverType === "renter" ? "purple" : "green"}>
                            {record.driverType === "renter" ? t("type_renter") : t("type_affiliate")}
                          </Badge>
                        </Td>
                        <Td isNumeric>{formatCurrency(record.platformData.filter(p => p.platform === "uber").reduce((acc, curr) => acc + (curr.totalValue || 0), 0))}</Td>
                        <Td isNumeric>{formatCurrency(record.platformData.filter(p => p.platform === "bolt").reduce((acc, curr) => acc + (curr.totalValue || 0), 0))}</Td>
                        <Td isNumeric fontWeight="bold">{formatCurrency(record.ganhosTotal)}</Td>
                        <Td isNumeric color="red.600">-{formatCurrency(record.ivaValor)}</Td>
                        <Td isNumeric color="red.600">-{formatCurrency(record.despesasAdm)}</Td>
                        <Td isNumeric color="orange.600">-{formatCurrency(record.combustivel)}</Td>
                        <Td isNumeric color="orange.600">-{formatCurrency(record.viaverde)}</Td>
                        <Td isNumeric color="purple.600">-{formatCurrency(record.aluguel)}</Td>
                        <Td isNumeric fontWeight="bold" color="blue.600">
                          {formatCurrency(record.repasse)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>

        {unassigned.length > 0 && (
          <Card variant="outline">
            <CardHeader>
              <Heading size="sm" color="orange.500">
                {translateAdmin('weekly_unassigned_title', 'Registos sem motorista associado')}
              </Heading>
            </CardHeader>
            <CardBody>
              <Text fontSize="sm" color="gray.600" mb={3}>
                {translateAdmin('weekly_unassigned_description', 'Revise estes lançamentos e atualize os cadastros para mapear corretamente.')} ({unassigned.length})
              </Text>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>{translateAdmin('platform_label', 'Plataforma')}</Th>
                    <Th>{translateAdmin('reference_label', 'Referência')}</Th>
                    <Th>{translateAdmin('value_label', 'Valor')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {unassigned.map((entry) => (
                    <Tr key={entry.id}>
                      <Td textTransform="capitalize">{entry.platform}</Td>
                      <Td>{entry.referenceLabel || entry.referenceId}</Td>
                      <Td isNumeric>{formatCurrency(entry.totalValue)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}
      </VStack>
    </AdminLayout>
  );
}

// SSR com autenticação, traduções e dados iniciais
export const getServerSideProps = withAdminSSR(async (context, user) => {
  // Gerar opções de semanas
  const weekOptions = getWeekOptions(12);
  const currentWeek = weekOptions.length > 0 ? weekOptions[0].value : '';

  return {
    weekOptions,
    currentWeek,
    initialRecords: [], // Será carregado via SWR no cliente
  };
});

