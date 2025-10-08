import { useState, useEffect, useMemo } from 'react';
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
  ButtonGroup,
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
  FiCheckCircle,
  FiRotateCcw,
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

const PAYMENT_STATUS_COLOR: Record<DriverWeeklyRecord['paymentStatus'], string> = {
  pending: 'orange',
  paid: 'green',
  cancelled: 'red',
};

const makeSafeT = (dictionary?: Record<string, any>) => (
  key: string,
  fallback?: string,
  variables?: Record<string, any>
) => {
  if (!dictionary) return fallback ?? key;
  const value = getTranslation(dictionary, key, variables);
  return value === key ? (fallback ?? key) : value;
};

export default function WeeklyPage({ user, translations, locale, weekOptions, currentWeek, initialRecords }: WeeklyPageProps) {
  const [filterWeek, setFilterWeek] = useState(currentWeek);
  const [records, setRecords] = useState<DriverRecord[]>(initialRecords);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingResumos, setIsGeneratingResumos] = useState(false);
  const [unassigned, setUnassigned] = useState<WeeklyNormalizedData[]>([]);
  const [generatingRecordId, setGeneratingRecordId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const t = useMemo(() => makeSafeT(translations.common), [translations.common]);
  const tAdmin = useMemo(() => makeSafeT(translations.admin), [translations.admin]);
  const typeLabels = useMemo(
    () => ({
      affiliate: tAdmin('weekly_records.types.affiliate', 'Afiliado'),
      renter: tAdmin('weekly_records.types.renter', 'Locatário'),
    }),
    [tAdmin]
  );

  const statusLabels = useMemo(
    () => ({
      pending: tAdmin('weekly_records.paymentStatus.pending', 'Pendente'),
      paid: tAdmin('weekly_records.paymentStatus.paid', 'Pago'),
      cancelled: tAdmin('weekly_records.paymentStatus.cancelled', 'Cancelado'),
    }),
    [tAdmin]
  );

  const formatDateLabel = (value: string | undefined, localeValue: string) => {
    if (!value) return '—';
    try {
      return new Intl.DateTimeFormat(localeValue, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(value));
    } catch (error) {
      return value;
    }
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
          title: tAdmin('errors.title', 'Erro'),
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

  const handleGeneratePayslip = async (record: DriverRecord) => {
    if (!record?.id) {
      return;
    }

    setGeneratingRecordId(record.id);
    try {
      const response = await fetch('/api/admin/weekly/generate-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ record }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.message || tAdmin('weekly_records.messages.generateError', 'Não foi possível gerar o contracheque.'));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contracheque_${record.driverName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_${record.weekStart}_a_${record.weekEnd}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: tAdmin('weekly_records.actions.generatePayslip', 'Gerar contracheque'),
        description: error?.message || tAdmin('weekly_records.messages.generateError', 'Não foi possível gerar o contracheque.'),
        status: 'error',
        duration: 4000,
      });
    } finally {
      setGeneratingRecordId(null);
    }
  };

  const handleTogglePaymentStatus = async (record: DriverRecord) => {
    if (!record?.id) {
      return;
    }

    const nextStatus = record.paymentStatus === 'paid' ? 'pending' : 'paid';
    setUpdatingPaymentId(record.id);

    try {
      const response = await fetch('/api/admin/weekly/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          record,
          updates: { paymentStatus: nextStatus },
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.message || tAdmin('weekly_records.messages.updateError', 'Não foi possível atualizar o status do pagamento.'));
      }

      const payload = await response.json();
      const updated: DriverWeeklyRecord = payload?.record;

      setRecords((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? {
                ...item,
                paymentStatus: updated?.paymentStatus ?? nextStatus,
                paymentDate: updated?.paymentDate ?? item.paymentDate,
                updatedAt: updated?.updatedAt ?? item.updatedAt,
              }
            : item
        )
      );

      toast({
        title:
          nextStatus === 'paid'
            ? tAdmin('weekly_records.actions.markAsPaid', 'Marcar como pago')
            : tAdmin('weekly_records.actions.markAsPending', 'Marcar como pendente'),
        description:
          nextStatus === 'paid'
            ? tAdmin('weekly_records.messages.markPaidSuccess', 'Pagamento marcado como concluído.')
            : tAdmin('weekly_records.messages.markPendingSuccess', 'Pagamento marcado como pendente.'),
        status: 'success',
        duration: 4000,
      });
    } catch (error: any) {
      toast({
        title: tAdmin('weekly_records.actions.markAsPaid', 'Marcar como pago'),
        description: error?.message || tAdmin('weekly_records.messages.updateError', 'Não foi possível atualizar o status do pagamento.'),
        status: 'error',
        duration: 4000,
      });
    } finally {
      setUpdatingPaymentId(null);
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
                  {tAdmin('dashboard.actions.refresh', 'Atualizar')}
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
                      <Th>{tAdmin('weekly_records.columns.driver', 'Motorista')}</Th>
                      <Th>{tAdmin('weekly_records.columns.type', 'Tipo')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.platformUber', 'Uber')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.platformBolt', 'Bolt')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.grossTotal', 'Ganhos brutos')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.iva', 'IVA')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.adminExpenses', 'Taxa adm.')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.fuel', 'Combustível')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.tolls', 'Portagens')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.rent', 'Aluguel')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.net', 'Valor líquido')}</Th>
                      <Th>{tAdmin('weekly_records.columns.status', 'Status')}</Th>
                      <Th textAlign="right">{tAdmin('weekly_records.columns.actions', 'Ações')}</Th>
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
                            {typeLabels[record.driverType]}
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          {formatCurrency(
                            record.platformData
                              .filter((p) => p.platform === 'uber')
                              .reduce((acc, curr) => acc + (curr.totalValue || 0), 0)
                          )}
                        </Td>
                        <Td isNumeric>
                          {formatCurrency(
                            record.platformData
                              .filter((p) => p.platform === 'bolt')
                              .reduce((acc, curr) => acc + (curr.totalValue || 0), 0)
                          )}
                        </Td>
                        <Td isNumeric fontWeight="bold">{formatCurrency(record.ganhosTotal)}</Td>
                        <Td isNumeric color="red.600">-{formatCurrency(record.ivaValor)}</Td>
                        <Td isNumeric color="red.600">-{formatCurrency(record.despesasAdm)}</Td>
                        <Td isNumeric color="orange.600">-{formatCurrency(record.combustivel)}</Td>
                        <Td isNumeric color="orange.600">-{formatCurrency(record.viaverde)}</Td>
                        <Td isNumeric color="purple.600">-{formatCurrency(record.aluguel)}</Td>
                        <Td isNumeric fontWeight="bold" color="blue.600">
                          {formatCurrency(record.repasse)}
                        </Td>
                        <Td>
                          <VStack align="flex-start" spacing={1}>
                            <Badge colorScheme={PAYMENT_STATUS_COLOR[record.paymentStatus] || 'gray'}>
                              {statusLabels[record.paymentStatus] || record.paymentStatus}
                            </Badge>
                            {record.paymentDate && (
                              <Text fontSize="xs" color="gray.500">
                                {formatDateLabel(record.paymentDate, locale || 'pt-PT')}
                              </Text>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <ButtonGroup size="xs" variant="outline" spacing={2} justifyContent="flex-end">
                            <Button
                              leftIcon={<Icon as={FiFileText} />}
                              onClick={() => handleGeneratePayslip(record)}
                              isLoading={generatingRecordId === record.id}
                              loadingText={tAdmin('weekly_records.messages.generateInProgress', 'A gerar contracheque...')}
                            >
                              {tAdmin('weekly_records.actions.generatePayslip', 'Gerar contracheque')}
                            </Button>
                            <Button
                              leftIcon={<Icon as={record.paymentStatus === 'paid' ? FiRotateCcw : FiCheckCircle} />}
                              colorScheme={record.paymentStatus === 'paid' ? 'yellow' : 'green'}
                              onClick={() => handleTogglePaymentStatus(record)}
                              isLoading={updatingPaymentId === record.id}
                            >
                              {record.paymentStatus === 'paid'
                                ? tAdmin('weekly_records.actions.markAsPending', 'Marcar como pendente')
                                : tAdmin('weekly_records.actions.markAsPaid', 'Marcar como pago')}
                            </Button>
                          </ButtonGroup>
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
                {tAdmin('weekly_unassigned_title', 'Registos sem motorista associado')}
              </Heading>
            </CardHeader>
            <CardBody>
              <Text fontSize="sm" color="gray.600" mb={3}>
                {tAdmin('weekly_unassigned_description', 'Revise estes lançamentos e atualize os cadastros para mapear corretamente.')} ({unassigned.length})
              </Text>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>{tAdmin('platform_label', 'Plataforma')}</Th>
                    <Th>{tAdmin('reference_label', 'Referência')}</Th>
                    <Th>{tAdmin('value_label', 'Valor')}</Th>
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
  // Gerar opções de semanas baseado nos dados reais
  const weekOptions = await getWeekOptions(12);
  const currentWeek = weekOptions.length > 0 ? weekOptions[0].value : '';

  return {
    weekOptions,
    currentWeek,
    initialRecords: [], // Será carregado via SWR no cliente
  };
});

