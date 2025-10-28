import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Grid,
  HStack,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
  useDisclosure,
  useToast,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiChevronDown,
  FiInfo,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiUpload,
} from 'react-icons/fi';
import { MdAdd } from 'react-icons/md';
import type { WeeklyDataOverview, WeeklyPlatform } from '@/lib/admin/weeklyDataShared';
import { WEEKLY_PLATFORMS } from '@/lib/admin/weeklyDataShared';
import type { IntegrationPlatform } from '@/schemas/integration';
import { IntegrationSummaryRecord } from '@/lib/integrations/integration-summary';
import type { SafeTranslator } from '@/lib/utils/safeTranslate';

type WeekStatus = 'complete' | 'partial' | 'pending' | 'error';
type StrategyOption = 'api' | 'upload' | 'mixed';

const WEEK_STATUS_COLORS: Record<WeekStatus, string> = {
  complete: 'green',
  partial: 'orange',
  pending: 'gray',
  error: 'red',
};

const SOURCE_STATUS_COLORS: Record<WeekStatus, string> = {
  complete: 'green',
  partial: 'orange',
  pending: 'gray',
  error: 'red',
};

const STRATEGY_COLORS: Record<StrategyOption | 'empty', string> = {
  api: 'blue',
  upload: 'purple',
  mixed: 'teal',
  empty: 'gray',
};

const STRATEGY_LABELS: Record<StrategyOption | 'empty', string> = {
  api: 'API',
  upload: 'Upload',
  mixed: 'Misto',
  empty: 'Vazio',
};

const MANUAL_ONLY_PLATFORMS: IntegrationPlatform[] = ['cartrack', 'myprio', 'viaverde'];

function formatDate(value?: string, fallback = '—') {
  if (!value) return fallback;
  try {
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  } catch (_error) {
    return value;
  }
}

function formatDateTime(value?: string, locale = 'pt-PT') {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (_error) {
    return value;
  }
}

function getWeekStatus(week: WeeklyDataOverview): WeekStatus {
  const statuses = WEEKLY_PLATFORMS
    .map((platform) => week.sources?.[platform]?.status as WeekStatus | undefined)
    .filter((status): status is WeekStatus => Boolean(status));

  if (statuses.some((status) => status === 'error')) {
    return 'error';
  }

  if (week.isComplete || statuses.every((status) => status === 'complete')) {
    return 'complete';
  }

  if (statuses.some((status) => status === 'complete' || status === 'partial')) {
    return 'partial';
  }

  if (week.totalRawFiles > 0) {
    return 'partial';
  }

  return 'pending';
}

function deriveStrategy(
  source: WeeklyDataOverview['sources'][WeeklyPlatform],
  raw: WeeklyDataOverview['rawFiles'][WeeklyPlatform]
): StrategyOption | 'empty' {
  if (source?.strategy) {
    return source.strategy;
  }
  if (!raw || (raw.total ?? 0) === 0) {
    if (!source || (!source.recordsCount && !source.driversCount)) {
      return 'empty';
    }
  }

  if (source?.origin === 'auto' && raw.total > 0) {
    return 'mixed';
  }

  if (source?.origin === 'auto') {
    return 'api';
  }

  if (raw.total > 0) {
    return 'upload';
  }

  return 'upload';
}

interface WeeklyDataTabProps {
  weeks: WeeklyDataOverview[];
  isValidating: boolean;
  integrations: IntegrationSummaryRecord[];
  user: { uid: string } | null;
  onProcessWeek: (weekId: string) => Promise<void>;
  onFetchPlatform: (platform: IntegrationPlatform) => Promise<void>;
  onRefresh: () => Promise<void>;
  onOpenUploadModal: (platform: WeeklyPlatform) => void;
  onOpenLogs: (platform: IntegrationPlatform) => void;
  onOpenCreateWizard: () => void;
  onOpenReplaceWizard: (week: WeeklyDataOverview) => void;
  t: SafeTranslator;
  tc: SafeTranslator;
}

export function WeeklyDataTab({
  weeks,
  isValidating,
  integrations,
  user,
  onProcessWeek,
  onFetchPlatform,
  onRefresh,
  onOpenUploadModal,
  onOpenLogs,
  onOpenCreateWizard,
  onOpenReplaceWizard,
  t,
  tc,
}: WeeklyDataTabProps) {
  const router = useRouter();
  const toast = useToast();
  const [selectedWeekId, setSelectedWeekId] = useState<string>(() => {
    const queryWeek = typeof router.query.week === 'string' ? router.query.week : undefined;
    return queryWeek ?? weeks[0]?.weekId ?? '';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WeekStatus | 'all'>('all');

  const filteredWeeks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return weeks.filter((week) => {
      const status = getWeekStatus(week);
      const matchesStatus = statusFilter === 'all' || statusFilter === status;
      if (!matchesStatus) return false;

      if (!normalizedSearch) return true;

      return [week.weekId, week.weekStart, week.weekEnd]
        .map((value) => value?.toLowerCase() ?? '')
        .some((value) => value.includes(normalizedSearch));
    });
  }, [weeks, searchTerm, statusFilter]);

  const selectedWeek = useMemo(
    () => weeks.find((week) => week.weekId === selectedWeekId) || null,
    [weeks, selectedWeekId]
  );

  const integrationMap = useMemo(() => {
    return integrations.reduce<Record<IntegrationPlatform, IntegrationSummaryRecord>>((acc, integration) => {
      acc[integration.platform] = integration;
      return acc;
    }, {} as Record<IntegrationPlatform, IntegrationSummaryRecord>);
  }, [integrations]);

  const statusLabels = useMemo(() => ({
    complete: t('weeklyDataSources.status.complete', 'Completo'),
    partial: t('weeklyDataSources.status.partial', 'Parcial'),
    pending: t('weeklyDataSources.status.pending', 'Pendente'),
    error: t('weeklyDataSources.status.error', 'Erro'),
  }), [t]);

  return (
    <>
      <Grid templateColumns={{ base: '1fr', xl: '280px 1fr' }} flexGrow={1} gap={4} alignItems="stretch">
        <Card h="full">
          <CardHeader p={4} pb={0}>
            <Stack spacing={2}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t('weeklyDataSources.filters.search', 'Pesquisar semana')}
                />
              </InputGroup>
              <Select
                size="sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as WeekStatus | 'all')}
              >
                <option value="all">{t('weeklyDataSources.filters.status.all', 'Todos')}</option>
                <option value="complete">{statusLabels.complete}</option>
                <option value="partial">{statusLabels.partial}</option>
                <option value="pending">{statusLabels.pending}</option>
                <option value="error">{statusLabels.error}</option>
              </Select>
            </Stack>
          </CardHeader>
          <CardBody p={4}>
            <Stack spacing={4} h={{base: 'auto', md: '56vh'}} maxH={"56vh"} overflowY="auto">
              {isValidating && weeks.length === 0 ? (
                <Flex justify="center" py={10}>
                  <Spinner />
                </Flex>
              ) : filteredWeeks.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  {t('weeklyDataSources.messages.empty', 'Nenhuma semana encontrada para os filtros selecionados.')}
                </Text>
              ) : (
                filteredWeeks.map((week) => {
                  const weekStatus = getWeekStatus(week);
                  const isSelected = week.weekId == selectedWeekId;
                  return (
                    <Card
                      key={week.weekId}
                      variant={isSelected ? 'solid' : 'outline'}
                      bgColor={isSelected ? 'green.100' : undefined}
                      cursor="pointer"
                      onClick={() => setSelectedWeekId(week.weekId)}
                    >
                      <CardBody>
                        <Stack spacing={2}>
                          <HStack justify="space-between" align="start">
                            <Heading size="sm">{week.weekId}</Heading>
                            <Badge colorScheme={WEEK_STATUS_COLORS[weekStatus]}>{statusLabels[weekStatus]}</Badge>
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(week.weekStart)} — {formatDate(week.weekEnd)}
                          </Text>
                          <HStack spacing={2}>
                            <Tag size="sm" colorScheme="blue" variant="subtle">
                              <TagLabel>
                                {t('weeklyDataSources.labels.sourcesComplete', '{{complete}}/{{total}} fontes', {
                                  complete: String(
                                    WEEKLY_PLATFORMS.filter((platform) =>
                                      week.sources?.[platform]?.status === 'complete'
                                    ).length
                                  ),
                                  total: String(WEEKLY_PLATFORMS.length),
                                })}
                              </TagLabel>
                            </Tag>
                            <Tag size="sm" colorScheme="gray" variant="subtle">
                              <TagLabel>
                                {t('weeklyDataSources.labels.pendingRaw', 'Pendentes')}: {week.pendingRawFiles}
                              </TagLabel>
                            </Tag>
                          </HStack>
                        </Stack>
                      </CardBody>
                    </Card>
                  );
                })
              )}
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader p={4} pb={0}>
            <HStack align="center" spacing={3}>
              <Heading size="sm" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" color="gray.600">
                {selectedWeek?.weekId}
              </Heading>
              <Spacer />
              {selectedWeek && (
                <HStack spacing={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onProcessWeek(selectedWeek.weekId)}
                  >
                    {t('weeklyDataSources.actions.processAll', 'Processar tudo')}
                  </Button>
                  <Menu>
                    <MenuButton as={Button} size="xs" rightIcon={<FiChevronDown />}>
                      {t('weeklyDataSources.actions.more', 'Ações')}
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={() => router.push(`/admin/weekly/import?week=${selectedWeek.weekId}`)}>
                        <Icon as={FiUpload} mr={2} />
                        {t('weeklyDataSources.actions.importAll', 'Importar tudo')}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          WEEKLY_PLATFORMS.filter(
                            (platform) =>
                              !MANUAL_ONLY_PLATFORMS.includes(platform as IntegrationPlatform)
                          ).forEach((platform) => onFetchPlatform(platform as IntegrationPlatform));
                        }}
                      >
                        <Icon as={FiRefreshCw} mr={2} />
                        {t('weeklyDataSources.actions.fetchAll', 'Buscar tudo da API')}
                      </MenuItem>
                      <MenuItem onClick={() => onOpenReplaceWizard(selectedWeek)}>
                        <Icon as={FiSettings} mr={2} />
                        {t('weeklyDataSources.actions.replaceSnapshot', 'Substituir snapshot')}
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              )}
            </HStack>
          </CardHeader>
          <CardBody p={4}>
            {selectedWeek ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {WEEKLY_PLATFORMS.map((platform) => {
                  const source = selectedWeek.sources?.[platform];
                  const raw = selectedWeek.rawFiles?.[platform];

                  // Skip if source or raw are undefined (shouldn't happen but safety check)
                  if (!source || !raw) {
                    console.warn(`⚠️ Missing data for platform ${platform}:`, { source, raw });
                    return null;
                  }

                  const strategy = deriveStrategy(source, raw);
                  const integration = integrationMap[platform];
                  const platformStatus = (source.status as WeekStatus) ?? 'pending';

                  return (
                    <Card key={platform} variant="outline" borderColor="gray.200">
                      <CardBody>
                        <Stack spacing={3}>
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="semibold" textTransform="capitalize">
                                {platform}
                              </Text>
                              <Tag size="sm" colorScheme={STRATEGY_COLORS[strategy]}>
                                <TagLabel>{STRATEGY_LABELS[strategy]}</TagLabel>
                              </Tag>
                            </VStack>
                            <Badge colorScheme={SOURCE_STATUS_COLORS[platformStatus]}>
                              {statusLabels[platformStatus]}
                            </Badge>
                          </HStack>
                          <Stack spacing={1} fontSize="xs" color="gray.600">
                            <Text>
                              {t('weeklyDataSources.labels.lastSnapshot', 'Snapshot API')}:{' '}
                              {formatDateTime(source.importedAt, router.locale || 'pt-PT')}
                            </Text>
                            <Text>
                              {t('weeklyDataSources.labels.files', 'Arquivos')}:{' '}
                              {raw.total} · {t('weeklyDataSources.labels.processed', 'processados')}: {raw.processed}
                            </Text>
                            <Text>
                              {t('weeklyDataSources.labels.records', 'Registos')}:{' '}
                              {source.recordsCount ?? 0}
                            </Text>
                          </Stack>
                          <HStack justify="space-between" flexWrap="wrap" rowGap={2}>
                            <Tooltip label={t('weeklyDataSources.tooltips.integration', 'Integração associada')}>
                              <Tag size="sm" colorScheme={integration?.enabled ? 'green' : 'gray'}>
                                <TagLabel>
                                  {integration?.enabled
                                    ? t('weeklyDataSources.integration.enabled', 'Integração ativa')
                                    : t('weeklyDataSources.integration.disabled', 'Integração inativa')}
                                </TagLabel>
                              </Tag>
                            </Tooltip>
                            <Menu>
                              <MenuButton as={Button} size="xs" rightIcon={<FiChevronDown />}>
                                {t('weeklyDataSources.actions.cardMenu', 'Ações')}
                              </MenuButton>
                              <MenuList>
                                <MenuItem onClick={() => onOpenUploadModal(platform)}>
                                  <Icon as={FiUpload} mr={2} />
                                  {t('weeklyDataSources.actions.importFile', 'Importar arquivo')}
                                </MenuItem>
                                <MenuItem
                                  onClick={() => onFetchPlatform(platform)}
                                  isDisabled={MANUAL_ONLY_PLATFORMS.includes(platform)}
                                >
                                  <Icon as={FiRefreshCw} mr={2} />
                                  {t('weeklyDataSources.actions.fetchApi', 'Buscar da API')}
                                </MenuItem>
                                <MenuItem onClick={() => onProcessWeek(selectedWeek.weekId)}>
                                  <Icon as={FiActivity} mr={2} />
                                  {t('weeklyDataSources.actions.process', 'Processar')}
                                </MenuItem>
                                <MenuItem onClick={() => onOpenLogs(platform)}>
                                  <Icon as={FiInfo} mr={2} />
                                  {t('weeklyDataSources.actions.viewLogs', 'Ver logs')}
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </HStack>

                          {raw.entries.length > 0 && (
                            <Stack spacing={1} fontSize="xs" color="gray.500">
                              <Text>
                                {t('weeklyDataSources.labels.versions', 'Versões do snapshot')}:{' '}
                                {raw.entries
                                  .slice(0, 3)
                                  .map((entry, index) => `${t('weeklyDataSources.labels.version', 'v')}${index + 1}`)
                                  .join(', ')}
                                {raw.entries.length > 3 ? '…' : ''}
                              </Text>
                            </Stack>
                          )}

                          {integration && integration.missingScopes.length > 0 && (
                            <Alert status="warning" variant="left-accent" borderRadius="md" fontSize="xs">
                              <AlertIcon />
                              <Text>
                                {t('weeklyDataSources.alerts.missingScopes', 'Escopos ausentes')}: {integration.missingScopes.join(', ')}
                              </Text>
                            </Alert>
                          )}
                        </Stack>
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>
            ) : (
              <Flex justify="center" py={20}>
                <Stack spacing={3} align="center">
                  <Spinner />
                  <Text fontSize="sm" color="gray.500">
                    {t('weeklyDataSources.messages.selectWeek', 'Selecione uma semana para ver os detalhes.')}
                  </Text>
                </Stack>
              </Flex>
            )}
          </CardBody>
        </Card>
      </Grid>
    </>
  );
}
