import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Flex,
  HStack,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spacer,
  Spinner,
  Stack,
  Tag,
  TagLabel,
  Text,
  Tooltip,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { MdAdd } from 'react-icons/md';
import { FiRefreshCw } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import type { WeeklyDataOverview, WeeklyPlatform } from '@/lib/admin/weeklyDataShared';
import { WEEKLY_PLATFORMS } from '@/lib/admin/weeklyDataShared';

type DataPageProps = AdminPageProps & {
  initialWeeks: WeeklyDataOverview[];
};

type WeekStatus = 'complete' | 'partial' | 'pending';

const STATUS_BADGE_COLOR: Record<WeekStatus, string> = {
  complete: 'green',
  partial: 'yellow',
  pending: 'gray',
};

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_FORMAT_OPTIONS,
  hour: '2-digit',
  minute: '2-digit',
};

function formatDate(value: string | undefined, locale: string) {
  if (!value) return '—';
  try {
    // Simply format YYYY-MM-DD to DD/MM/YYYY without any timezone conversion
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  } catch (_error) {
    return value;
  }
}

function formatDateTime(value: string | undefined, locale: string) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(locale, DATE_TIME_FORMAT_OPTIONS).format(new Date(value));
  } catch (_error) {
    return value;
  }
}

function getWeekStatus(week: WeeklyDataOverview): WeekStatus {
  if (week.isComplete) {
    return 'complete';
  }

  const statuses = WEEKLY_PLATFORMS
    .map((platform) => week.sources?.[platform]?.status as WeekStatus | undefined)
    .filter((status): status is WeekStatus => Boolean(status));

  if (statuses.length === 0) {
    return week.totalRawFiles > 0 ? 'partial' : 'pending';
  }

  if (statuses.every((status) => status === 'complete')) {
    return 'complete';
  }

  if (statuses.some((status) => status === 'complete' || status === 'partial')) {
    return 'partial';
  }

  return 'pending';
}

export default function DataPage({ initialWeeks, tCommon, tPage }: DataPageProps) {
  const router = useRouter();
  const toast = useToast();

  const [weeks, setWeeks] = useState<WeeklyDataOverview[]>(initialWeeks);
  const [loading, setLoading] = useState(false);
  const [syncingWeekId, setSyncingWeekId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WeekStatus | ''>('');

  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const platformLabels = useMemo(() => {
    return WEEKLY_PLATFORMS.reduce<Record<WeeklyPlatform, string>>((acc, platform) => {
      acc[platform] = t(`weeklyDataSources.platforms.${platform}`, platform.toUpperCase());
      return acc;
    }, {} as Record<WeeklyPlatform, string>);
  }, [t]);

  const statusLabels = useMemo(
    () => ({
      complete: t('weeklyDataSources.status.complete', 'Completo'),
      partial: t('weeklyDataSources.status.partial', 'Parcial'),
      pending: t('weeklyDataSources.status.pending', 'Pendente'),
    }),
    [t]
  );

  const reloadWeeks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/weekly/data-sources');
      if (!response.ok) {
        throw new Error('Failed to fetch weekly data sources');
      }
      const data = await response.json();
      setWeeks(data.weeks ?? []);
    } catch (error: any) {
      toast({
        title: tc('errors.title', 'Erro'),
        description: error?.message || t('weeklyDataSources.errors.fetch', 'Falha ao carregar semanas.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [t, tc, toast]);

  useEffect(() => {
    if (!initialWeeks || initialWeeks.length === 0) {
      reloadWeeks();
    }
  }, [initialWeeks, reloadWeeks]);

  const filteredWeeks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return weeks.filter((week) => {
      const status = getWeekStatus(week);
      const matchesStatus = !statusFilter || statusFilter === status;
      const matchesSearch =
        !normalizedSearch ||
        [week.weekId, week.weekStart, week.weekEnd]
          .map((value) => value?.toLowerCase() ?? '')
          .some((value) => value.includes(normalizedSearch));
      return matchesSearch && matchesStatus;
    });
  }, [weeks, searchTerm, statusFilter]);

  const handleAddWeek = () => {
    router.push('/admin/weekly/import');
  };

  const handleSync = async (weekId: string) => {
    setSyncingWeekId(weekId);
    try {
      const rawDataResponse = await fetch(`/api/admin/imports/get-raw-data-ids?weekId=${weekId}`);
      if (!rawDataResponse.ok) {
        throw new Error('Failed to fetch raw data references');
      }
      const { rawDataDocIds } = await rawDataResponse.json();

      if (!rawDataDocIds || rawDataDocIds.length === 0) {
        toast({
          title: tc('messages.info', 'Informação'),
          description: t('weeklyDataSources.messages.noRawData', 'Nenhum dado bruto disponível para processar.'),
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        setSyncingWeekId(null);
        return;
      }

      const processResponse = await fetch('/api/admin/imports/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, rawDataDocIds }),
      });
      const data = await processResponse.json();

      if (!processResponse.ok) {
        throw new Error(data?.message || 'Failed to process raw data');
      }

      toast({
        title: tc('messages.success', 'Sucesso'),
        description: data?.message || t('weeklyDataSources.messages.processSuccess', 'Dados processados com sucesso.'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      await reloadWeeks();
    } catch (error: any) {
      toast({
        title: tc('errors.title', 'Erro'),
        description: error?.message || t('weeklyDataSources.errors.process', 'Falha ao processar dados brutos.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncingWeekId(null);
    }
  };

  return (
    <AdminLayout
      title={t('weeklyDataSources.title', 'Fontes de dados')}
      subtitle={t('weeklyDataSources.subtitle', 'Gerencie importações, status e processamento semanal')}
      breadcrumbs={[{ label: t('weeklyDataSources.breadcrumb', 'Fontes de dados') }]}
      side={
        <HStack spacing={3}>
          <Button
            variant="outline"
            leftIcon={<FiRefreshCw />}
            onClick={reloadWeeks}
            isLoading={loading}
            size="sm"
          >
            {tc('actions.refresh', 'Atualizar')}
          </Button>
          <Button leftIcon={<MdAdd />} colorScheme="green" onClick={handleAddWeek} size="sm">
            {t("weeklyDataSources.actions.addWeek", "Adicionar semana")}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/integrations")}
            size="sm"
          >
            {t("weeklyDataSources.actions.integrations", "Integrações")}
          </Button>
        </HStack>
      }
    >
      <Stack spacing={6}>
        <Card>
          <CardBody>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align={{ base: 'stretch', md: 'center' }}>
              <InputGroup maxW={{ base: '100%', md: '320px' }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t('weeklyDataSources.filters.search', 'Pesquisar semanas')}
                />
              </InputGroup>

              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as WeekStatus | '')}
                maxW={{ base: '100%', md: '220px' }}
              >
                <option value="">{t('weeklyDataSources.filters.status.all', 'Todos os status')}</option>
                <option value="complete">{t('weeklyDataSources.filters.status.complete', 'Completo')}</option>
                <option value="partial">{t('weeklyDataSources.filters.status.partial', 'Parcial')}</option>
                <option value="pending">{t('weeklyDataSources.filters.status.pending', 'Pendente')}</option>
              </Select>
            </Stack>
          </CardBody>
        </Card>

        {loading ? (
          <Flex justify="center" py={20}>
            <Spinner size="xl" />
          </Flex>
        ) : filteredWeeks.length === 0 ? (
          <Box textAlign="center" py={16}>
            <Text color="gray.600">
              {t('weeklyDataSources.messages.empty', 'Nenhuma semana encontrada para os filtros selecionados.')}
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
            {filteredWeeks.map((week) => {
              const status = getWeekStatus(week);

              return (
                <Card key={week.weekId} p={0} borderWidth="1px" borderColor="gray.200">
                  <CardHeader pb={4}>
                    <VStack align="start" spacing={1}>
                      <HStack w="full">
                        <Heading size="md">{week.weekId}</Heading>
                        <Spacer />
                        <Badge colorScheme={STATUS_BADGE_COLOR[status]}>{statusLabels[status]}</Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {formatDate(week.weekStart, router.locale || 'pt')} —{' '}
                        {formatDate(week.weekEnd, router.locale || 'pt')}
                      </Text>
                    </VStack>
                  </CardHeader>

                  <Divider />

                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      {WEEKLY_PLATFORMS.map((platform) => {
                        const source = week.sources?.[platform];
                        const raw = week.rawFiles[platform];
                        const platformStatus = (source?.status as WeekStatus | undefined) ?? 'pending';

                        return (
                          <Box key={platform} borderWidth="1px" borderColor="gray.100" borderRadius="md" p={3}>
                            <HStack align="start" justify="space-between" spacing={3}>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="semibold">{platformLabels[platform]}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {t('weeklyDataSources.labels.rawFiles', 'Arquivos brutos')}: {raw.total}
                                </Text>
                              </VStack>
                              <VStack align="end" spacing={1}>
                                <Tooltip label={statusLabels[platformStatus]}>
                                  <Badge colorScheme={STATUS_BADGE_COLOR[platformStatus]}>
                                    {statusLabels[platformStatus]}
                                  </Badge>
                                </Tooltip>
                                {raw.total > 0 ? (
                                  <Tag variant="subtle" colorScheme={raw.pending > 0 ? 'orange' : 'green'} size="sm">
                                    <TagLabel>
                                      {raw.pending > 0
                                        ? `${raw.pending} ${t('weeklyDataSources.labels.pendingRaw', 'pendente(s)')}`
                                        : t('weeklyDataSources.labels.allProcessed', 'Todos processados')}
                                    </TagLabel>
                                  </Tag>
                                ) : (
                                  <Tag variant="subtle" size="sm">
                                    <TagLabel>{t('weeklyDataSources.labels.noRaw', 'Nenhum envio')}</TagLabel>
                                  </Tag>
                                )}
                              </VStack>
                            </HStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  </CardBody>

                  <Divider />

                  <CardFooter pt={4} justifyContent="space-between" flexWrap="wrap" gap={4}>
                    <VStack align="start" spacing={1}>
                      {week.lastImportAt && (
                        <Text fontSize="xs" color="gray.500">
                          {t('weeklyDataSources.labels.updatedAt', 'Última importação')}: {formatDateTime(week.lastImportAt, router.locale || 'pt')}
                        </Text>
                      )}
                      <Text fontSize="xs" color="gray.500">
                        {t('weeklyDataSources.labels.pendingRaw', 'Pendentes')}: {week.pendingRawFiles} ·{' '}
                        {t('weeklyDataSources.labels.processedRaw', 'Processados')}: {week.totalRawFiles - week.pendingRawFiles}
                      </Text>
                    </VStack>

                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/weekly?week=${week.weekId}`)}
                      >
                        {t('weeklyDataSources.actions.viewWeek', 'Ver semana')}
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleSync(week.weekId)}
                        isLoading={syncingWeekId === week.weekId}
                        isDisabled={week.pendingRawFiles === 0 || (syncingWeekId !== null && syncingWeekId !== week.weekId)}
                      >
                        {t('weeklyDataSources.actions.sync', 'Sincronizar')}
                      </Button>
                    </HStack>
                  </CardFooter>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Stack>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async () => {
  const { fetchWeeklyDataOverview } = await import('@/lib/admin/weeklyDataOverview');
  const initialWeeks = await fetchWeeklyDataOverview();
  return {
    initialWeeks,
  };
});

