import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Heading,
  type HeadingProps,
  Icon,
  IconButton,
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
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TagLabel,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiChevronDown,
  FiClock,
  FiExternalLink,
  FiInfo,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiUpload,
} from 'react-icons/fi';
import { MdAdd } from 'react-icons/md';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import type { WeeklyDataOverview, WeeklyPlatform } from '@/lib/admin/weeklyDataShared';
import { WEEKLY_PLATFORMS } from '@/lib/admin/weeklyDataShared';
import type { IntegrationPlatform, IntegrationStatus } from '@/schemas/integration';
import type { IntegrationLogSeverity, IntegrationLogType } from '@/schemas/integration-log';
import { IntegrationSummaryRecord, buildIntegrationSummary } from '@/lib/integrations/integration-summary';
import { getWeekDates, getWeekId } from '@/lib/utils/date-helpers';
import { REQUIRED_CREDENTIALS } from '@/schemas/integration';

import type { Integration } from '@/schemas/integration';

type FetchError = Error & { status?: number; info?: any };

const SECTION_HEADING_PROPS: HeadingProps = {
  size: 'sm',
  fontWeight: 'semibold',
  textTransform: 'uppercase',
  letterSpacing: 'wide',
  color: 'gray.600',
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    let message = 'Request failed';
    let info: any = null;
    try {
      const data = await response.json();
      info = data;
      if (data?.error) {
        message = data.error;
      }
    } catch (error) {
      // ignore
    }
    const error: FetchError = new Error(message);
    error.status = response.status;
    error.info = info;
    throw error;
  }
  return response.json();
};

type StrategyOption = 'api' | 'upload' | 'mixed';
type WeekStatus = 'complete' | 'partial' | 'pending' | 'error';

type SafeTranslator = ReturnType<typeof createSafeTranslator>;

type IntegrationSummary = IntegrationSummaryRecord;

type WeeksResponse = {
  weeks: WeeklyDataOverview[];
};

type IntegrationsResponse = {
  integrations: IntegrationSummary[];
};

type IntegrationLogItem = {
  id: string;
  platform: IntegrationPlatform;
  type: IntegrationLogType;
  severity: IntegrationLogSeverity;
  message: string;
  details?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  metadata?: Record<string, any>;
  timestamp: string;
  expiresAt?: string;
};

type LogsResponse = {
  logs: IntegrationLogItem[];
};

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

const SEVERITY_COLORS: Record<IntegrationLogSeverity, string> = {
  debug: 'gray',
  info: 'blue',
  warning: 'orange',
  error: 'red',
  critical: 'red',
};

const LOG_TYPE_COLORS: Record<IntegrationLogType, string> = {
  success: 'green',
  error: 'red',
  warning: 'orange',
  info: 'blue',
  auth: 'purple',
  sync: 'teal',
  test: 'gray',
};

const DEFAULT_STRATEGIES: Record<WeeklyPlatform, StrategyOption> = {
  uber: 'api',
  bolt: 'api',
  cartrack: 'upload',
  myprio: 'upload',
  viaverde: 'upload',
};

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

function deriveOriginLabel(strategy: StrategyOption | 'empty', t: SafeTranslator) {
  switch (strategy) {
    case 'api':
      return t('weeklyDataSources.origin.api', 'API');
    case 'upload':
      return t('weeklyDataSources.origin.upload', 'Upload');
    case 'mixed':
      return t('weeklyDataSources.origin.mixed', 'Misto');
    case 'empty':
    default:
      return t('weeklyDataSources.origin.empty', 'Vazio');
  }
}

interface CreateWeekWizardProps {
  isOpen: boolean;
  mode: 'create' | 'replace';
  initialWeekId?: string | null;
  initialStrategies?: Partial<Record<WeeklyPlatform, StrategyOption>>;
  onClose: () => void;
  onSubmit: (
    payload: {
      weekId: string;
      strategies: Record<WeeklyPlatform, StrategyOption>;
      allowOverride: boolean;
    }
  ) => Promise<void>;
  isSubmitting: boolean;
  t: SafeTranslator;
  tc: SafeTranslator;
}

function CreateWeekWizard({
  isOpen,
  mode,
  initialWeekId,
  initialStrategies,
  onClose,
  onSubmit,
  isSubmitting,
  t,
  tc,
}: CreateWeekWizardProps) {
  const [step, setStep] = useState(0);
  const [dateInput, setDateInput] = useState('');
  const [weekId, setWeekId] = useState(initialWeekId ?? '');
  const [strategies, setStrategies] = useState<Record<WeeklyPlatform, StrategyOption>>(() => ({
    ...DEFAULT_STRATEGIES,
    ...(initialStrategies ?? {}),
  }));

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setStep(initialWeekId ? 1 : 0);
    setDateInput('');
    setWeekId(initialWeekId ?? '');
    setStrategies({
      ...DEFAULT_STRATEGIES,
      ...(initialStrategies ?? {}),
    });
  }, [isOpen, initialWeekId, initialStrategies]);

  const weekDates = weekId ? getWeekDates(weekId) : null;

  const canAdvance = step === 0 ? Boolean(weekId) : true;

  const handleNext = () => {
    if (step < 2) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const handleDateChange = (value: string) => {
    setDateInput(value);
    if (value) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        setWeekId(getWeekId(parsed));
      }
    }
  };

  const handleStrategyChange = (platform: WeeklyPlatform, value: StrategyOption) => {
    setStrategies((prev) => ({
      ...prev,
      [platform]: value,
    }));
  };

  const handleSubmit = async () => {
    if (step < 2) {
      handleNext();
      return;
    }
    if (!weekId) {
      return;
    }
    await onSubmit({
      weekId,
      strategies,
      allowOverride: mode === 'replace',
    });
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <Stack spacing={4}>
          <Text>{t('weeklyDataWizard.labels.selectWeek', 'Escolha uma data dentro da semana desejada:')}</Text>
          <Input
            type="date"
            value={dateInput}
            onChange={(event) => handleDateChange(event.target.value)}
          />
          {weekId && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Stack spacing={1}>
                <AlertTitle>{t('weeklyDataWizard.preview.week', 'Semana selecionada')}</AlertTitle>
                <AlertDescription>
                  {weekId} · {formatDate(weekDates?.start)} — {formatDate(weekDates?.end)}
                </AlertDescription>
              </Stack>
            </Alert>
          )}
        </Stack>
      );
    }

    if (step === 1) {
      return (
        <Stack spacing={4}>
          <Text>{t('weeklyDataWizard.labels.chooseStrategy', 'Defina a origem dos dados para cada fonte:')}</Text>
          <Stack spacing={3}>
            {WEEKLY_PLATFORMS.map((platform) => (
              <Card key={platform} variant="outline">
                <CardBody>
                  <Stack spacing={3}>
                    <Heading size="sm" textTransform="capitalize">
                      {platform}
                    </Heading>
                    <ButtonGroup size="sm" isAttached>
                      {(['api', 'mixed', 'upload'] as StrategyOption[]).map((option) => (
                        <Button
                          key={option}
                          variant={strategies[platform] === option ? 'solid' : 'outline'}
                          colorScheme={STRATEGY_COLORS[option]}
                          onClick={() => handleStrategyChange(platform, option)}
                        >
                          {STRATEGY_LABELS[option]}
                        </Button>
                      ))}
                    </ButtonGroup>
                    {strategies[platform] === 'mixed' && (
                      <Text fontSize="sm" color="gray.500">
                        {t(
                          'weeklyDataWizard.labels.mixedHint',
                          'Tentaremos coletar pela API e indicaremos uploads pendentes.'
                        )}
                      </Text>
                    )}
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Stack>
        </Stack>
      );
    }

    return (
      <Stack spacing={4}>
        <Text>{t('weeklyDataWizard.labels.review', 'Confira o resumo antes de criar:')}</Text>
        <Card variant="outline">
          <CardBody>
            <Stack spacing={3}>
              <HStack justify="space-between">
                <Text fontWeight="medium">{t('weeklyDataWizard.summary.week', 'Semana')}</Text>
                <Text>{weekId}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="medium">{t('weeklyDataWizard.summary.period', 'Período')}</Text>
                <Text>
                  {formatDate(weekDates?.start)} — {formatDate(weekDates?.end)}
                </Text>
              </HStack>
              <Divider />
              <Stack spacing={2}>
                {WEEKLY_PLATFORMS.map((platform) => (
                  <HStack key={platform} justify="space-between">
                    <Text textTransform="capitalize">{platform}</Text>
                    <Tag colorScheme={STRATEGY_COLORS[strategies[platform]]}>
                      <TagLabel>{STRATEGY_LABELS[strategies[platform]]}</TagLabel>
                    </Tag>
                  </HStack>
                ))}
              </Stack>
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    );
  };

  const primaryLabel = step === 2
    ? mode === 'replace'
      ? t('weeklyDataWizard.actions.replace', 'Substituir snapshot')
      : t('weeklyDataWizard.actions.create', 'Criar snapshot')
    : t('weeklyDataWizard.actions.next', 'Avançar');

  return (
    <Modal size="xl" isOpen={isOpen} onClose={isSubmitting ? () => undefined : onClose} closeOnOverlayClick={!isSubmitting}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {mode === 'replace'
            ? t('weeklyDataWizard.title.replace', 'Substituir snapshot semanal')
            : t('weeklyDataWizard.title.create', 'Criar nova semana')}
        </ModalHeader>
        <ModalCloseButton isDisabled={isSubmitting} />
        <ModalBody>
          <Stack spacing={4}>
            <Text fontSize="sm" color="gray.500">
              {t('weeklyDataWizard.progress', 'Passo {{step}} de {{total}}', {
                step: String(step + 1),
                total: '3',
              })}
            </Text>
            {renderStepContent()}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button onClick={onClose} variant="ghost" isDisabled={isSubmitting}>
              {tc('actions.cancel', 'Cancelar')}
            </Button>
            {step > 0 && (
              <Button onClick={handleBack} variant="outline" isDisabled={isSubmitting}>
                {t('weeklyDataWizard.actions.back', 'Voltar')}
              </Button>
            )}
            <Button
              colorScheme="green"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={isSubmitting || !canAdvance}
            >
              {primaryLabel}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

type DataPageProps = AdminPageProps & {
  initialWeeks: WeeklyDataOverview[];
  initialIntegrations: IntegrationSummary[];
};

export default function DataPage({ initialWeeks, initialIntegrations, tCommon, tPage, translations }: DataPageProps) {
  const router = useRouter();
  const toast = useToast();
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const { data: weeksResponse, mutate: mutateWeeks, isValidating: isValidatingWeeks } = useSWR<WeeksResponse>(
    '/api/admin/weekly/data-sources',
    fetcher,
    {
      fallbackData: { weeks: initialWeeks },
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      onErrorRetry: (error, _key, _config, _revalidate, _opts) => {
        if ((error as FetchError).status === 401 || (error as FetchError).status === 403) {
          return;
        }
      },
    }
  );

  const weeks = weeksResponse?.weeks ?? [];

  const [selectedWeekId, setSelectedWeekId] = useState<string>(() => {
    const queryWeek = typeof router.query.week === 'string' ? router.query.week : undefined;
    return queryWeek ?? initialWeeks[0]?.weekId ?? '';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WeekStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!weeks.length) {
      return;
    }
    if (!selectedWeekId || !weeks.some((week) => week.weekId === selectedWeekId)) {
      setSelectedWeekId(weeks[0].weekId);
    }
  }, [weeks, selectedWeekId]);

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

  const { data: integrationResponse, mutate: mutateIntegrations, isValidating: isValidatingIntegrations } =
    useSWR<IntegrationsResponse>('/api/admin/integrations/summary', fetcher, {
      fallbackData: { integrations: initialIntegrations },
      refreshInterval: 120_000,
      revalidateOnFocus: true,
      onErrorRetry: (error, _key, _config, _revalidate, _opts) => {
        if ((error as FetchError).status === 401 || (error as FetchError).status === 403) {
          return;
        }
      },
    });

  const integrations = useMemo(() => {
    const list = integrationResponse?.integrations ?? initialIntegrations;
    return WEEKLY_PLATFORMS.map((platform) => {
      const match = list.find((integration) => integration.platform === platform);
      return (
        match ?? {
          platform,
          name: platform.toUpperCase(),
          enabled: false,
          status: 'inactive',
          credentials: {},
          missingCredentials: [],
          scopes: [],
          missingScopes: [],
          totalRequests: 0,
          failedRequests: 0,
          lastSync: null,
          lastSuccess: null,
          lastError: null,
          errorMessage: null,
          updatedAt: null,
        }
      );
    });
  }, [integrationResponse?.integrations, initialIntegrations]);

  const [integrationForms, setIntegrationForms] = useState<Record<IntegrationPlatform, Record<string, string>>>(() => {
    return initialIntegrations.reduce<Record<IntegrationPlatform, Record<string, string>>>((acc, integration) => {
      acc[integration.platform] = { ...integration.credentials };
      return acc;
    }, {} as Record<IntegrationPlatform, Record<string, string>>);
  });

  useEffect(() => {
    setIntegrationForms((prev) => {
      const next = { ...prev };
      integrations.forEach((integration) => {
        if (!next[integration.platform]) {
          next[integration.platform] = { ...integration.credentials };
        }
      });
      return next;
    });
  }, [integrations]);

  const [savingIntegration, setSavingIntegration] = useState<Record<IntegrationPlatform, boolean>>({} as Record<IntegrationPlatform, boolean>);
  const [testingIntegration, setTestingIntegration] = useState<Record<IntegrationPlatform, boolean>>({} as Record<IntegrationPlatform, boolean>);

  const [logPlatformFilter, setLogPlatformFilter] = useState<'all' | IntegrationPlatform>('all');
  const [logTypeFilter, setLogTypeFilter] = useState<'all' | IntegrationLogType>('all');
  const [logSeverityFilter, setLogSeverityFilter] = useState<'all' | IntegrationLogSeverity>('all');
  const [logLimit, setLogLimit] = useState(50);
  const [selectedLog, setSelectedLog] = useState<IntegrationLogItem | null>(null);

  const logsQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', String(logLimit));
    if (logPlatformFilter !== 'all') params.set('platform', logPlatformFilter);
    if (logTypeFilter !== 'all') params.set('type', logTypeFilter);
    if (logSeverityFilter !== 'all') params.set('severity', logSeverityFilter);
    return `/api/admin/integrations/logs?${params.toString()}`;
  }, [logLimit, logPlatformFilter, logTypeFilter, logSeverityFilter]);

  const {
    data: logsResponse,
    isValidating: isValidatingLogs,
    mutate: mutateLogs,
  } = useSWR<LogsResponse>(logsQuery, fetcher, {
    revalidateOnFocus: false,
    onErrorRetry: (error, _key, _config, _revalidate, _opts) => {
      if ((error as FetchError).status === 401 || (error as FetchError).status === 403) {
        return;
      }
    },
  });

  const logs = logsResponse?.logs ?? [];

  const logDetailsDisclosure = useDisclosure();
  const wizardDisclosure = useDisclosure();
  const [wizardMode, setWizardMode] = useState<'create' | 'replace'>('create');
  const [wizardWeekId, setWizardWeekId] = useState<string | null>(null);
  const [wizardStrategies, setWizardStrategies] = useState<Partial<Record<WeeklyPlatform, StrategyOption>>>({});
  const [isSubmittingSnapshot, setIsSubmittingSnapshot] = useState(false);

  const handleIntegrationFieldChange = useCallback(
    (platform: IntegrationPlatform, key: string, value: string) => {
      setIntegrationForms((prev) => ({
        ...prev,
        [platform]: {
          ...(prev[platform] ?? {}),
          [key]: value,
        },
      }));
    },
    []
  );

  const submitIntegrationUpdate = useCallback(
    async (
      platform: IntegrationPlatform,
      credentials: Record<string, string>,
      isActive: boolean,
      successMessage: string
    ) => {
      setSavingIntegration((prev) => ({ ...prev, [platform]: true }));
      try {
        const response = await fetch(`/api/admin/integrations/${platform}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentials, isActive }),
        });
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.error || t('weeklyDataSources.integrations.messages.saveError', 'Não foi possível atualizar a integração.'));
        }
        await mutateIntegrations();
        toast({
          title: t('weeklyDataSources.integrations.messages.toastTitle', 'Integração atualizada'),
          description: successMessage,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      } catch (error: any) {
        toast({
          title: tc('errors.title', 'Erro'),
          description: error?.message ?? tc('errors.tryAgain', 'Tente novamente mais tarde.'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setSavingIntegration((prev) => ({ ...prev, [platform]: false }));
      }
    },
    [mutateIntegrations, t, tc, toast]
  );

  const handleSaveIntegration = useCallback(
    async (platform: IntegrationPlatform) => {
      const credentials = integrationForms[platform] ?? {};
      const requiredKeys = REQUIRED_CREDENTIALS[platform] ?? [];
      const missing = requiredKeys.filter((key) => !credentials[key]?.toString().trim());

      if (missing.length > 0) {
        toast({
          title: tc('errors.title', 'Erro'),
          description: t('weeklyDataSources.integrations.messages.missingFields', 'Preencha todos os campos obrigatórios.'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      await submitIntegrationUpdate(
        platform,
        credentials,
        Boolean(integrations.find((integration) => integration.platform === platform)?.enabled),
        t('weeklyDataSources.integrations.messages.saved', 'Configuração atualizada com sucesso.'),
      );
    },
    [integrationForms, integrationResponse?.integrations, integrations, submitIntegrationUpdate, t, tc, toast]
  );

  const handleToggleIntegration = useCallback(
    async (platform: IntegrationPlatform, nextEnabled: boolean) => {
      const credentials = integrationForms[platform] ?? {};
      if (nextEnabled) {
        const missing = integrations
          .find((integration) => integration.platform === platform)?.missingCredentials ?? [];
        if (missing.length > 0) {
          toast({
            title: tc('errors.title', 'Erro'),
            description: t('weeklyDataSources.integrations.messages.missingFields', 'Preencha todos os campos obrigatórios.'),
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }
      await submitIntegrationUpdate(
        platform,
        credentials,
        nextEnabled,
        nextEnabled
          ? t('weeklyDataSources.integrations.messages.enabled', 'Integração ativada com sucesso.')
          : t('weeklyDataSources.integrations.messages.disabled', 'Integração desativada.'),
      );
    },
    [integrationForms, integrations, submitIntegrationUpdate, t, tc, toast]
  );

  const handleTestIntegration = useCallback(
    async (platform: IntegrationPlatform) => {
      setTestingIntegration((prev) => ({ ...prev, [platform]: true }));
      try {
        const response = await fetch('/api/admin/integrations/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform }),
        });
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.error || t('weeklyDataSources.integrations.messages.testError', 'Não foi possível testar a integração.'));
        }
        toast({
          title: t('weeklyDataSources.integrations.messages.testSuccessTitle', 'Conexão verificada'),
          description: result.message || t('weeklyDataSources.integrations.messages.testSuccess', 'Integração conectada com sucesso.'),
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
        await mutateIntegrations();
      } catch (error: any) {
        toast({
          title: tc('errors.title', 'Erro'),
          description: error?.message ?? t('weeklyDataSources.integrations.messages.testError', 'Não foi possível testar a integração.'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setTestingIntegration((prev) => ({ ...prev, [platform]: false }));
      }
    },
    [mutateIntegrations, t, tc, toast]
  );

  const handleFetchPlatform = useCallback(
    async (platform: IntegrationPlatform) => {
      if (MANUAL_ONLY_PLATFORMS.includes(platform)) {
        toast({
          title: tc('messages.info', 'Informação'),
          description: t(
            'weeklyDataSources.actions.fetchNotAvailable',
            'Esta integração depende de uploads manuais. Utilize o importador em vez de sincronizar via API.'
          ),
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      try {
        const response = await fetch(`/api/admin/integrations/${platform}/data`);
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.error || 'Falha ao buscar dados.');
        }
        toast({
          title: t('weeklyDataSources.actions.fetchSuccess', 'Coleta iniciada'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await mutateLogs();
      } catch (error: any) {
        toast({
          title: tc('errors.title', 'Erro'),
          description: error?.message ?? tc('errors.tryAgain', 'Tente novamente mais tarde.'),
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    },
    [mutateLogs, t, tc, toast]
  );

  const handleProcessWeek = useCallback(
    async (weekId: string) => {
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

        await mutateWeeks();
      } catch (error: any) {
        toast({
          title: tc('errors.title', 'Erro'),
          description: error?.message || t('weeklyDataSources.errors.process', 'Falha ao processar dados brutos.'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    },
    [mutateWeeks, t, tc, toast]
  );

  const handleCreateSnapshot = useCallback(
    async ({ weekId, strategies, allowOverride }: { weekId: string; strategies: Record<WeeklyPlatform, StrategyOption>; allowOverride: boolean }) => {
      setIsSubmittingSnapshot(true);
      try {
        const response = await fetch('/api/admin/weekly/create-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weekId, strategies, allowOverride }),
        });
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.error || 'Falha ao criar snapshot.');
        }
        toast({
          title: t('weeklyDataWizard.toasts.created', 'Semana preparada'),
          description: t('weeklyDataWizard.toasts.createdDescription', 'Snapshot criado e aguardando importações.'),
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
        wizardDisclosure.onClose();
        setSelectedWeekId(weekId);
        await mutateWeeks();
      } catch (error: any) {
        toast({
          title: tc('errors.title', 'Erro'),
          description: error?.message ?? tc('errors.tryAgain', 'Tente novamente mais tarde.'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsSubmittingSnapshot(false);
      }
    },
    [mutateWeeks, t, tc, toast, wizardDisclosure]
  );

  const openCreateWeekWizard = () => {
    setWizardMode('create');
    setWizardWeekId(null);
    setWizardStrategies({});
    wizardDisclosure.onOpen();
  };

  const openReplaceWeekWizard = () => {
    if (!selectedWeek) return;
    const currentStrategies: Partial<Record<WeeklyPlatform, StrategyOption>> = {};
    WEEKLY_PLATFORMS.forEach((platform) => {
      const strategy = deriveStrategy(selectedWeek.sources[platform], selectedWeek.rawFiles[platform]);
      if (strategy !== 'empty') {
        currentStrategies[platform] = strategy as StrategyOption;
      }
    });
    setWizardMode('replace');
    setWizardWeekId(selectedWeek.weekId);
    setWizardStrategies(currentStrategies);
    wizardDisclosure.onOpen();
  };

  const handleOpenLogs = (platform: IntegrationPlatform) => {
    setActiveTab(2);
    setLogPlatformFilter(platform);
  };

  const statusLabels = useMemo(() => ({
    complete: t('weeklyDataSources.status.complete', 'Completo'),
    partial: t('weeklyDataSources.status.partial', 'Parcial'),
    pending: t('weeklyDataSources.status.pending', 'Pendente'),
    error: t('weeklyDataSources.status.error', 'Erro'),
  }), [t]);

  const selectedWeekStatus = selectedWeek ? getWeekStatus(selectedWeek) : 'pending';
  const integrationMap = useMemo(() => {
    return integrations.reduce<Record<IntegrationPlatform, IntegrationSummary>>((acc, integration) => {
      acc[integration.platform] = integration;
      return acc;
    }, {} as Record<IntegrationPlatform, IntegrationSummary>);
  }, [integrations]);

  return (
    <>
      <AdminLayout
        title={t('weeklyDataSources.title', 'Fontes de dados')}
        subtitle={t('weeklyDataSources.subtitle', 'Snapshots semanais e integrações contínuas')}
        breadcrumbs={[{ label: t('weeklyDataSources.breadcrumb', 'Fontes de dados') }]}
        translations={translations}
        side={
          <HStack spacing={4} align="center">
            <Button
              variant="outline"
              leftIcon={<FiRefreshCw />}
              onClick={() => mutateWeeks()}
              isLoading={isValidatingWeeks}
              size="sm"
            >
              {tc('actions.refresh', 'Atualizar')}
            </Button>
            <Button leftIcon={<MdAdd />} colorScheme="green" size="sm" onClick={openCreateWeekWizard}>
              {t('weeklyDataSources.actions.addWeek', 'Nova semana')}
            </Button>
          </HStack>
        }
      >
        <Tabs index={activeTab} onChange={setActiveTab} variant="soft-rounded" colorScheme="green">
          <TabList overflowX="auto">
            <Tab>{t('weeklyDataSources.tabs.weeks', 'Semanas')}</Tab>
            <Tab>{t('weeklyDataSources.tabs.integrations', 'Integrações')}</Tab>
            <Tab>{t('weeklyDataSources.tabs.jobs', 'Jobs & Logs')}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0}>
              <Grid templateColumns={{ base: '1fr', xl: '280px 1fr 320px' }} gap={4} alignItems="stretch">
                <GridItem>
                  <Card h="100%">
                    <CardHeader pb={3}>
                      <Stack spacing={2}>
                        <Heading {...SECTION_HEADING_PROPS}>
                          {t('weeklyDataSources.weeks.list', 'Semanas')}
                        </Heading>
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
                    <CardBody>
                      <Stack spacing={3} maxH="520px" overflowY="auto">
                        {isValidatingWeeks && weeks.length === 0 ? (
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
                            const isSelected = week.weekId === selectedWeekId;
                            return (
                              <Card
                                key={week.weekId}
                                variant={isSelected ? 'solid' : 'outline'}
                                colorScheme={isSelected ? 'green' : undefined}
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
                </GridItem>

                <GridItem>
                  <Stack spacing={4} h="100%">
                    <Card>
                      <CardHeader pb={3}>
                        <HStack align="center" spacing={3}>
                          <Heading {...SECTION_HEADING_PROPS}>
                            {t('weeklyDataSources.week.header', 'Snapshot da semana')}
                          </Heading>
                          <Spacer />
                          {selectedWeek && (
                            <HStack spacing={2}>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleProcessWeek(selectedWeek.weekId)}
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
                                        (platform): platform is IntegrationPlatform =>
                                          !MANUAL_ONLY_PLATFORMS.includes(platform as IntegrationPlatform)
                                      ).forEach((platform) => handleFetchPlatform(platform as IntegrationPlatform));
                                    }}
                                  >
                                    <Icon as={FiRefreshCw} mr={2} />
                                    {t('weeklyDataSources.actions.fetchAll', 'Buscar tudo da API')}
                                  </MenuItem>
                                  <MenuItem onClick={openReplaceWeekWizard}>
                                    <Icon as={FiSettings} mr={2} />
                                    {t('weeklyDataSources.actions.replaceSnapshot', 'Substituir snapshot')}
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </HStack>
                          )}
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        {selectedWeek ? (
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            {WEEKLY_PLATFORMS.map((platform) => {
                              const source = selectedWeek.sources[platform];
                              const raw = selectedWeek.rawFiles[platform];
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
                                            <MenuItem onClick={() => router.push(`/admin/weekly/import?week=${selectedWeek.weekId}&platform=${platform}`)}>
                                              <Icon as={FiUpload} mr={2} />
                                              {t('weeklyDataSources.actions.importFile', 'Importar arquivo')}
                                            </MenuItem>
                                            <MenuItem
                                              onClick={() => handleFetchPlatform(platform)}
                                              isDisabled={MANUAL_ONLY_PLATFORMS.includes(platform)}
                                            >
                                              <Icon as={FiRefreshCw} mr={2} />
                                              {t('weeklyDataSources.actions.fetchApi', 'Buscar da API')}
                                            </MenuItem>
                                            <MenuItem onClick={() => handleProcessWeek(selectedWeek.weekId)}>
                                              <Icon as={FiActivity} mr={2} />
                                              {t('weeklyDataSources.actions.process', 'Processar')}
                                            </MenuItem>
                                            <MenuItem onClick={() => handleOpenLogs(platform)}>
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
                  </Stack>
                </GridItem>

                <GridItem>
                  <Card h="100%">
                    <CardHeader pb={3}>
                      <Heading {...SECTION_HEADING_PROPS}>
                        {t('weeklyDataSources.summary.title', 'Resumo da semana')}
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      {selectedWeek ? (
                        <Stack spacing={4}>
                          <Stack spacing={3}>
                            <Stat>
                              <StatLabel>{t('weeklyDataSources.summary.drivers', 'Motoristas')}</StatLabel>
                              <StatNumber>
                                {Math.max(
                                  ...WEEKLY_PLATFORMS.map((platform) => selectedWeek.sources[platform].driversCount ?? 0)
                                )}
                              </StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>{t('weeklyDataSources.summary.trips', 'Registos')}</StatLabel>
                              <StatNumber>
                                {WEEKLY_PLATFORMS.reduce(
                                  (acc, platform) => acc + (selectedWeek.sources[platform].recordsCount ?? 0),
                                  0
                                )}
                              </StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>{t('weeklyDataSources.summary.lastUpdate', 'Última atualização')}</StatLabel>
                              <StatHelpText>{formatDateTime(selectedWeek.updatedAt, router.locale || 'pt-PT')}</StatHelpText>
                            </Stat>
                          </Stack>

                          <Divider />

                          <Stack spacing={3}>
                            <Heading size="xs" textTransform="uppercase" color="gray.500">
                              {t('weeklyDataSources.summary.alerts', 'Alertas')}
                            </Heading>
                            {WEEKLY_PLATFORMS.filter((platform) => !integrationMap[platform]?.enabled).length === 0 &&
                              selectedWeek.pendingRawFiles === 0 &&
                              selectedWeekStatus === 'complete' ? (
                              <Tag size="sm" colorScheme="green">
                                <TagLabel>{t('weeklyDataSources.summary.noAlerts', 'Tudo sincronizado')}</TagLabel>
                              </Tag>
                            ) : (
                              <Stack spacing={2}>
                                {WEEKLY_PLATFORMS.filter((platform) => !integrationMap[platform]?.enabled).map((platform) => (
                                  <Tag key={`${platform}-integration`} size="sm" colorScheme="yellow">
                                    <TagLabel>
                                      {t('weeklyDataSources.alerts.integrationInactive', 'Integração {{platform}} inativa', {
                                        platform: platform.toUpperCase(),
                                      })}
                                    </TagLabel>
                                  </Tag>
                                ))}
                                {selectedWeek.pendingRawFiles > 0 && (
                                  <Tag size="sm" colorScheme="orange">
                                    <TagLabel>
                                      {t('weeklyDataSources.alerts.pendingUploads', '{{count}} upload(s) pendente(s)', {
                                        count: String(selectedWeek.pendingRawFiles),
                                      })}
                                    </TagLabel>
                                  </Tag>
                                )}
                                {selectedWeekStatus === 'error' && (
                                  <Tag size="sm" colorScheme="red">
                                    <TagLabel>
                                      {t('weeklyDataSources.alerts.snapshotError', 'Erro durante processamento. Consulte os logs.')}
                                    </TagLabel>
                                  </Tag>
                                )}
                              </Stack>
                            )}
                          </Stack>
                        </Stack>
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          {t('weeklyDataSources.messages.selectWeek', 'Selecione uma semana para visualizar o resumo.')}
                        </Text>
                      )}
                    </CardBody>
                  </Card>
                </GridItem>
              </Grid>
            </TabPanel>

            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                {integrations.map((integration) => {
                  const formValues = integrationForms[integration.platform] ?? {};
                  const isSaving = Boolean(savingIntegration[integration.platform]);
                  const isTesting = Boolean(testingIntegration[integration.platform]);

                  const statusColorMap: Record<string, string> = {
                    active: 'green',
                    pending: 'yellow',
                    error: 'red',
                    inactive: 'gray',
                    connected: 'green',
                    disconnected: 'gray',
                    expired: 'red',
                  };
                  const statusColor = statusColorMap[integration.status] || 'gray';

                  return (
                    <Card key={integration.platform} variant="outline">
                      <CardHeader pb={3}>
                        <Flex align="start" justify="space-between" gap={3}>
                          <Box>
                            <Heading size="sm">{integration.name}</Heading>
                            <HStack spacing={2} mt={1}>
                              <Badge colorScheme={statusColor}>
                                {t(`weeklyDataSources.integrations.status.${integration.status}`, integration.status)}
                              </Badge>
                              <Text fontSize="xs" color="gray.500">
                                {integration.updatedAt
                                  ? t('weeklyDataSources.integrations.labels.updatedAt', 'Atualizado em {{date}}', {
                                    date: formatDateTime(integration.updatedAt, router.locale || 'pt-PT'),
                                  })
                                  : t('weeklyDataSources.integrations.labels.neverUpdated', 'Nunca atualizado')}
                              </Text>
                            </HStack>
                          </Box>
                          <VStack spacing={1} align="end">
                            <Text fontSize="xs" color="gray.500">
                              {integration.enabled
                                ? t('weeklyDataSources.integrations.labels.enabled', 'Ativa')
                                : t('weeklyDataSources.integrations.labels.disabled', 'Inativa')}
                            </Text>
                            <Switch
                              colorScheme="green"
                              isChecked={integration.enabled}
                              onChange={(event) => handleToggleIntegration(integration.platform, event.target.checked)}
                              isDisabled={isSaving || isTesting}
                            />
                          </VStack>
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <Stack spacing={4}>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} fontSize="xs" color="gray.600">
                            <Box>
                              <Text fontWeight="semibold">
                                {t('weeklyDataSources.integrations.stats.requests', 'Total de chamadas')}
                              </Text>
                              <Text>{integration.totalRequests}</Text>
                            </Box>
                            <Box>
                              <Text fontWeight="semibold">
                                {t('weeklyDataSources.integrations.stats.failures', 'Falhas registradas')}
                              </Text>
                              <Text>{integration.failedRequests}</Text>
                            </Box>
                            <Box>
                              <Text fontWeight="semibold">
                                {t('weeklyDataSources.integrations.labels.lastSuccess', 'Último sucesso')}
                              </Text>
                              <Text>{formatDateTime(integration.lastSuccess, router.locale || 'pt-PT')}</Text>
                            </Box>
                            <Box>
                              <Text fontWeight="semibold">
                                {t('weeklyDataSources.integrations.labels.lastError', 'Último erro')}
                              </Text>
                              <Text>{formatDateTime(integration.lastError, router.locale || 'pt-PT')}</Text>
                            </Box>
                          </SimpleGrid>

                          {integration.errorMessage && (
                            <Alert status="warning" variant="left-accent" fontSize="sm">
                              <AlertIcon />
                              <AlertDescription>{integration.errorMessage}</AlertDescription>
                            </Alert>
                          )}

                          <Stack spacing={3}>
                            {(integration.missingCredentials?.length ?? 0) > 0 && (
                              <Tag size="sm" colorScheme="yellow" w="fit-content">
                                <TagLabel>
                                  {t('weeklyDataSources.integrations.labels.missingCredentials', 'Credenciais em falta')}
                                </TagLabel>
                              </Tag>
                            )}
                            {(integration.missingScopes?.length ?? 0) > 0 && (
                              <Tag size="sm" colorScheme="orange" w="fit-content">
                                <TagLabel>
                                  {t('weeklyDataSources.integrations.labels.missingScopes', 'Escopos pendentes')}: {integration.missingScopes.join(', ')}
                                </TagLabel>
                              </Tag>
                            )}
                          </Stack>

                          <Divider />

                          <Stack spacing={3}>
                            {(Object.keys(formValues).length === 0
                              ? Object.keys(integration.credentials)
                              : Object.keys(formValues)
                            ).map((key) => (
                              <FormControl key={key}>
                                <FormLabel fontSize="sm">{key}</FormLabel>
                                <Input
                                  type={key.toLowerCase().includes('secret') ? 'password' : 'text'}
                                  value={formValues[key] ?? ''}
                                  onChange={(event) => handleIntegrationFieldChange(integration.platform, key, event.target.value)}
                                  isDisabled={isSaving || isTesting}
                                />
                              </FormControl>
                            ))}
                          </Stack>
                        </Stack>
                      </CardBody>
                      <CardFooter pt={0} justify="space-between" flexWrap="wrap" rowGap={2}>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleSaveIntegration(integration.platform)}
                            isLoading={isSaving}
                            isDisabled={isTesting}
                          >
                            {t('weeklyDataSources.integrations.actions.save', 'Guardar credenciais')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestIntegration(integration.platform)}
                            isLoading={isTesting}
                            isDisabled={isSaving}
                          >
                            {t('weeklyDataSources.integrations.actions.test', 'Testar conexão')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFetchPlatform(integration.platform)}
                            leftIcon={<FiRefreshCw />}
                            isDisabled={MANUAL_ONLY_PLATFORMS.includes(integration.platform)}
                          >
                            {t('weeklyDataSources.integrations.actions.sync', 'Sincronizar agora')}
                          </Button>
                        </HStack>
                        <Button
                          size="sm"
                          variant="link"
                          colorScheme="gray"
                          rightIcon={<FiExternalLink />}
                          onClick={() => handleOpenLogs(integration.platform)}
                        >
                          {t('weeklyDataSources.integrations.actions.viewHistory', 'Ver histórico')}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </TabPanel>

            <TabPanel px={0}>
              <VStack spacing={4} mb={4} align={"stretch"}>
              <Card>
                <CardBody>
                  <Flex gap={4} flexWrap="wrap">
                    <Select
                      value={logPlatformFilter}
                      onChange={(event) => setLogPlatformFilter(event.target.value as 'all' | IntegrationPlatform)}
                      maxW="180px"
                    >
                      <option value="all">{t('weeklyDataSources.logs.filters.platform', 'Todas as plataformas')}</option>
                      {WEEKLY_PLATFORMS.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform.toUpperCase()}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={logTypeFilter}
                      onChange={(event) => setLogTypeFilter(event.target.value as 'all' | IntegrationLogType)}
                      maxW="180px"
                    >
                      <option value="all">{t('weeklyDataSources.logs.filters.type', 'Todos os tipos')}</option>
                      {(['success', 'error', 'warning', 'info', 'auth', 'sync', 'test'] as IntegrationLogType[]).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={logSeverityFilter}
                      onChange={(event) => setLogSeverityFilter(event.target.value as 'all' | IntegrationLogSeverity)}
                      maxW="180px"
                    >
                      <option value="all">{t('weeklyDataSources.logs.filters.severity', 'Todas as severidades')}</option>
                      {(['debug', 'info', 'warning', 'error', 'critical'] as IntegrationLogSeverity[]).map((severity) => (
                        <option key={severity} value={severity}>
                          {severity}
                        </option>
                      ))}
                    </Select>
                    <Select value={logLimit} onChange={(event) => setLogLimit(Number(event.target.value))} maxW="120px">
                      {[25, 50, 100, 200].map((limitOption) => (
                        <option key={limitOption} value={limitOption}>
                          {t('weeklyDataSources.logs.filters.limit', '{{count}} itens', {
                            count: String(limitOption),
                          })}
                        </option>
                      ))}
                    </Select>
                    <Spacer />
                    <Button leftIcon={<FiRefreshCw />} onClick={() => mutateLogs()} size="sm">
                      {tc('actions.refresh', 'Atualizar')}
                    </Button>
                  </Flex>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  {logs.length === 0 ? (
                    <Text fontSize="sm" color="gray.500">
                      {t('weeklyDataSources.logs.empty', 'Nenhum log encontrado com os filtros atuais.')}
                    </Text>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>{t('weeklyDataSources.logs.columns.time', 'Horário')}</Th>
                          <Th>{t('weeklyDataSources.logs.columns.platform', 'Plataforma')}</Th>
                          <Th>{t('weeklyDataSources.logs.columns.type', 'Tipo')}</Th>
                          <Th>{t('weeklyDataSources.logs.columns.severity', 'Severidade')}</Th>
                          <Th>{t('weeklyDataSources.logs.columns.message', 'Mensagem')}</Th>
                          <Th>{t('weeklyDataSources.logs.columns.actions', 'Ações')}</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {logs.map((log) => (
                          <Tr key={log.id}>
                            <Td>{formatDateTime(log.timestamp, router.locale || 'pt-PT')}</Td>
                            <Td>
                              <Tag size="sm" colorScheme="gray">
                                <TagLabel>{log.platform.toUpperCase()}</TagLabel>
                              </Tag>
                            </Td>
                            <Td>
                              <Tag size="sm" colorScheme={LOG_TYPE_COLORS[log.type]}>
                                <TagLabel>{log.type}</TagLabel>
                              </Tag>
                            </Td>
                            <Td>
                              <Tag size="sm" colorScheme={SEVERITY_COLORS[log.severity]}>
                                <TagLabel>{log.severity}</TagLabel>
                              </Tag>
                            </Td>
                            <Td maxW="360px">
                              <Tooltip label={log.message}>
                                <Text noOfLines={2}>{log.message}</Text>
                              </Tooltip>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  size="sm"
                                  aria-label={t('weeklyDataSources.logs.actions.details', 'Ver detalhes')}
                                  icon={<FiInfo />}
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedLog(log);
                                    logDetailsDisclosure.onOpen();
                                  }}
                                />
                                <IconButton
                                  size="sm"
                                  aria-label={t('weeklyDataSources.logs.actions.retry', 'Reexecutar')}
                                  icon={<FiActivity />}
                                  variant="ghost"
                                  onClick={() => handleFetchPlatform(log.platform)}
                                />
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </AdminLayout>

      <CreateWeekWizard
        isOpen={wizardDisclosure.isOpen}
        onClose={wizardDisclosure.onClose}
        mode={wizardMode}
        initialWeekId={wizardWeekId}
        initialStrategies={wizardStrategies}
        onSubmit={handleCreateSnapshot}
        isSubmitting={isSubmittingSnapshot}
        t={t}
        tc={tc}
      />

      <Modal isOpen={logDetailsDisclosure.isOpen} onClose={logDetailsDisclosure.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('weeklyDataSources.logs.details.title', 'Detalhes do log')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedLog ? (
              <Stack spacing={3} fontSize="sm">
                <HStack justify="space-between">
                  <Text fontWeight="semibold">{t('weeklyDataSources.logs.columns.platform', 'Plataforma')}</Text>
                  <Text>{selectedLog.platform.toUpperCase()}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="semibold">{t('weeklyDataSources.logs.columns.type', 'Tipo')}</Text>
                  <Text>{selectedLog.type}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="semibold">{t('weeklyDataSources.logs.columns.severity', 'Severidade')}</Text>
                  <Text>{selectedLog.severity}</Text>
                </HStack>
                <Divider />
                <Box>
                  <Text fontWeight="semibold">{t('weeklyDataSources.logs.columns.message', 'Mensagem')}</Text>
                  <Text whiteSpace="pre-wrap">{selectedLog.message}</Text>
                </Box>
                {selectedLog.details && (
                  <Box>
                    <Text fontWeight="semibold">{t('weeklyDataSources.logs.details.details', 'Detalhes')}</Text>
                    <Text whiteSpace="pre-wrap">{selectedLog.details}</Text>
                  </Box>
                )}
                {selectedLog.endpoint && (
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Endpoint</Text>
                    <Text>{selectedLog.endpoint}</Text>
                  </HStack>
                )}
                {selectedLog.statusCode && (
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">HTTP</Text>
                    <Text>{selectedLog.statusCode}</Text>
                  </HStack>
                )}
                {selectedLog.responseTime && (
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">{t('weeklyDataSources.logs.details.responseTime', 'Tempo de resposta')}</Text>
                    <Text>{selectedLog.responseTime}ms</Text>
                  </HStack>
                )}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <Box>
                    <Text fontWeight="semibold">Metadata</Text>
                    <Box as="pre" fontSize="xs" bg="gray.50" p={3} borderRadius="md" overflowX="auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </Box>
                  </Box>
                )}
              </Stack>
            ) : (
              <Text fontSize="sm" color="gray.500">
                {t('weeklyDataSources.logs.details.empty', 'Selecione um log para ver os detalhes.')}
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={logDetailsDisclosure.onClose}>{tc('actions.close', 'Fechar')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export const getServerSideProps = withAdminSSR(async () => {
  const { fetchWeeklyDataOverview } = await import('@/lib/admin/weeklyDataOverview');
  const initialWeeks = await fetchWeeklyDataOverview();
  const integrationServiceModule = await import('@/lib/integrations/integration-service');
  const service = integrationServiceModule.default;
  const integrations = await service.getAllIntegrations();
  const initialIntegrations = integrations
    .filter((integration: Integration) => WEEKLY_PLATFORMS.includes(integration.platform as WeeklyPlatform))
    .map(buildIntegrationSummary);

  return {
    initialWeeks,
    initialIntegrations,
  };
});
