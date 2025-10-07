
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  Box,
  Button,
  Badge,
  VStack,
  HStack,
  Text,
  Spinner,
  Icon,
  useToast,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Card,
  CardBody,
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  CardHeader,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Switch,
  useDisclosure,
  Code,
  Textarea,
  InputGroup,
  InputRightElement,
  IconButton,
  Tooltip,
  Select,
  InputLeftAddon,
  InputRightAddon,
  Progress,
} from '@chakra-ui/react';
import {
  FiUpload,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiWifi,
  FiWifiOff,
  FiSettings,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiActivity,
  FiEye,
  FiEyeOff,
  FiDatabase,
  FiServer,
  FiTrendingUp,
  FiFileText,
  FiCalendar,
} from 'react-icons/fi';
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';
import { useTranslations } from '@/hooks/useTranslations';
import { getTranslation } from '@/lib/translations';
import { WeeklyDataSources } from '@/pages/api/admin/weekly/data-sources'; // Importar a interface correta

// Interface para integrações (copiada de integrations.tsx)
interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  errorMessage?: string;
  isActive: boolean;
  credentials?: any;
}

interface DataPageProps extends AdminPageProps {
  initialWeeks: WeeklyDataSources[];
  initialIntegrations: Integration[];
}

export default function DataPage({ user, translations, locale, initialWeeks, initialIntegrations }: DataPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [weeks, setWeeks] = useState<WeeklyDataSources[]>(initialWeeks);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [syncingWeeks, setSyncingWeeks] = useState(false);

  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [testingAllIntegrations, setTestingAllIntegrations] = useState(false);
  const [syncingAllIntegrations, setSyncingAllIntegrations] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSavingIntegration, setIsSavingIntegration] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [fullIntegrationData, setFullIntegrationData] = useState<any>(null);
  const [selectedDataView, setSelectedDataView] = useState<Integration | null>(null);
  const [integrationData, setIntegrationData] = useState<any>(null);
  const [loadingIntegrationData, setLoadingIntegrationData] = useState(false);

  const { isOpen: isConfigModalOpen, onOpen: onConfigModalOpen, onClose: onConfigModalClose } = useDisclosure();
  const { isOpen: isDataModalOpen, onOpen: onDataModalOpen, onClose: onDataModalClose } = useDisclosure();
  const { isOpen: isImportModalOpen, onOpen: onImportModalOpen, onClose: onImportModalClose } = useDisclosure();

  const [importWeekId, setImportWeekId] = useState('');
  const [importMethod, setImportMethod] = useState<'file' | 'api'>('file');
  const [importPlatform, setImportPlatform] = useState<'uber' | 'bolt' | 'myprio' | 'viaverde'>('uber');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tAdmin = (key: string, variables?: Record<string, any>) => getTranslation(translations.page, key, variables) || key;

  // --- Funções de Gerenciamento de Semanas ---
  async function loadWeeklyData() {
    try {
      setLoadingWeeks(true);
      const response = await fetch("/api/admin/weekly/data-sources");

      if (!response.ok) {
        throw new Error("Failed to load weekly data");
      }

      const data = await response.json();
      setWeeks(data.weeks || []);
    } catch (error: any) {
      console.error("Error loading weekly data:", error);
      toast({
        title: tAdmin("data.error.load_title") || "Erro ao carregar dados",
        description: error.message || tAdmin("data.error.load_desc") || "Não foi possível carregar os dados semanais",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingWeeks(false);
    }
  }

  async function syncPlatformData() {
    try {
      setSyncingWeeks(true);
      const response = await fetch("/api/admin/integrations/sync", { // API para sincronizar todas as plataformas
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      toast({
        title: tAdmin("data.sync.success_title") || "Sincronização iniciada",
        description: tAdmin("data.sync.success_desc") || "A sincronização dos dados das plataformas foi iniciada",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setTimeout(() => {
        loadWeeklyData();
      }, 2000);

    } catch (error: any) {
      console.error("Error syncing data:", error);
      toast({
        title: tAdmin("data.sync.error_title") || "Erro na sincronização",
        description: error.message || tAdmin("data.sync.error_desc") || "Não foi possível sincronizar os dados",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncingWeeks(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'complete': return 'green';
      case 'partial': return 'yellow';
      case 'pending': return 'red';
      case 'error': return 'red';
      default: return 'gray';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'complete': return tAdmin('data.status.complete') || 'Completo';
      case 'partial': return tAdmin('data.status.partial') || 'Parcial';
      case 'pending': return tAdmin('data.status.pending') || 'Pendente';
      case 'error': return tAdmin('data.status.error') || 'Erro';
      default: return tAdmin('data.status.unknown') || 'Desconhecido';
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  const completeWeeks = weeks.filter(w => w.isComplete).length;
  const partialWeeks = weeks.filter(w => !w.isComplete && Object.values(w.sources).some(s => s.status === 'partial')).length;
  const pendingWeeks = weeks.filter(w => !w.isComplete && Object.values(w.sources).every(s => s.status === 'pending')).length;

  // --- Funções de Gerenciamento de Integrações ---
  const fetchIntegrations = async () => {
    try {
      const response = await fetch("/api/admin/integrations");
      const data = await response.json();
      if (data.success) {
        setIntegrations(data.integrations);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível carregar as integrações",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as integrações",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleOpenConfig = async (integration: Integration) => {
    setSelectedIntegration(integration);
    try {
      const response = await fetch(`/api/admin/integrations/${integration.id}`);
      const data = await response.json();

      if (data.integration) {
        setFullIntegrationData(data.integration);
        setFormData({
          isActive: data.integration.isActive || false,
          ...data.integration.credentials || {},
          ...data.integration.config || {},
        });
      } else {
        setFormData({ isActive: false });
        setFullIntegrationData(null);
      }
    } catch (error) {
      console.error("Error loading integration:", error);
      setFormData({ isActive: false });
      setFullIntegrationData(null);
    }
    onConfigModalOpen();
  };

  const handleSaveConfig = async () => {
    if (!selectedIntegration) return;

    setIsSavingIntegration(true);
    try {
      const response = await fetch(`/api/admin/integrations/${selectedIntegration.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credentials: getCredentialsFromForm(selectedIntegration.id),
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso!",
          description: `Configurações de ${selectedIntegration.name} salvas`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        fetchIntegrations(); // Recarregar integrações
        onConfigModalClose();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao salvar configurações",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSavingIntegration(false);
    }
  };

  const getCredentialsFromForm = (platform: string) => {
    switch (platform) {
      case 'cartrack':
        return {
          username: formData.username || '',
          apiKey: formData.apiKey || '',
        };
      case 'bolt':
        return {
          clientId: formData.clientId || '',
          clientSecret: formData.clientSecret || '',
        };
      case 'uber':
        return {
          clientId: formData.clientId || '',
          clientSecret: formData.clientSecret || '',
          orgUuid: formData.orgUuid || '',
        };
      case 'viaverde':
        return {
          email: formData.email || '',
          password: formData.password || '',
        };
      case 'myprio':
        return {
          accountId: formData.accountId || '',
          password: formData.password || '',
        };
      default:
        return {};
    }
  };

  const renderCredentialFields = () => {
    if (!selectedIntegration) return null;

    const togglePassword = (field: string) => {
      setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    switch (selectedIntegration.id) {
      case 'cartrack':
        return (
          <>
            <FormControl mb={4}>
              <FormLabel>Username</FormLabel>
              <Input
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Digite o username"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>API Key</FormLabel>
              <InputGroup>
                <Input
                  type={showPasswords['apiKey'] ? 'text' : 'password'}
                  value={formData.apiKey || ''}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Digite a API Key"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Toggle API Key visibility"
                    icon={<Icon as={showPasswords['apiKey'] ? FiEyeOff : FiEye} />}
                    onClick={() => togglePassword('apiKey')}
                    variant="ghost"
                    size="sm"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </>
        );

      case 'bolt':
      case 'uber':
        return (
          <>
            <FormControl mb={4}>
              <FormLabel>Client ID</FormLabel>
              <Input
                value={formData.clientId || ''}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="Digite o Client ID"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Client Secret</FormLabel>
              <InputGroup>
                <Input
                  type={showPasswords['clientSecret'] ? 'text' : 'password'}
                  value={formData.clientSecret || ''}
                  onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                  placeholder="Digite o Client Secret"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Toggle Client Secret visibility"
                    icon={<Icon as={showPasswords['clientSecret'] ? FiEyeOff : FiEye} />}
                    onClick={() => togglePassword('clientSecret')}
                    variant="ghost"
                    size="sm"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            {selectedIntegration.id === 'uber' && (
              <FormControl mb={4}>
                <FormLabel>Organization UUID</FormLabel>
                <Input
                  value={formData.orgUuid || ''}
                  onChange={(e) => setFormData({ ...formData, orgUuid: e.target.value })}
                  placeholder="Digite o Organization UUID"
                />
              </FormControl>
            )}
          </>
        );

      case 'viaverde':
        return (
          <>
            <FormControl mb={4}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Digite o email"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPasswords['password'] ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Digite a senha"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Toggle Password visibility"
                    icon={<Icon as={showPasswords['password'] ? FiEyeOff : FiEye} />}
                    onClick={() => togglePassword('password')}
                    variant="ghost"
                    size="sm"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </>
        );

      case 'myprio':
        return (
          <>
            <FormControl mb={4}>
              <FormLabel>Account ID</FormLabel>
              <Input
                value={formData.accountId || ''}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                placeholder="Digite o Account ID"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPasswords['password'] ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Digite a senha"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Toggle Password visibility"
                    icon={<Icon as={showPasswords['password'] ? FiEyeOff : FiEye} />}
                    onClick={() => togglePassword('password')}
                    variant="ghost"
                    size="sm"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </>
        );

      default:
        return <Text color="gray.500">Sem campos de configuração</Text>;
    }
  };

  const handleTestConnection = async (integration: Integration) => {
    try {
      setIntegrations(prev => prev.map(int =>
        int.id === integration.id
          ? { ...int, status: 'syncing' }
          : int
      ));

      const response = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform: integration.id }),
      });

      const data = await response.json();

      if (data.success) {
        setIntegrations(prev => prev.map(int =>
          int.id === integration.id
            ? {
              ...int,
              status: 'connected',
              errorMessage: undefined,
              lastSync: new Date().toISOString()
            }
            : int
        ));

        toast({
          title: 'Conexão bem-sucedida!',
          description: `Conexão com ${integration.name} estabelecida com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        setIntegrations(prev => prev.map(int =>
          int.id === integration.id
            ? {
              ...int,
              status: 'error',
              errorMessage: data.error || 'Erro na conexão'
            }
            : int
        ));

        toast({
          title: 'Erro na conexão',
          description: `Falha ao conectar com ${integration.name}: ${data.error}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      setIntegrations(prev => prev.map(int =>
        int.id === integration.id
          ? { ...int, status: 'error', errorMessage: 'Erro interno' }
          : int
      ));

      toast({
        title: 'Erro',
        description: 'Erro ao testar conexão',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTestAllIntegrations = async () => {
    setTestingAllIntegrations(true);
    try {
      for (const integration of integrations) {
        await handleTestConnection(integration);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      toast({
        title: 'Teste completo',
        description: 'Todos os testes de conexão foram executados',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTestingAllIntegrations(false);
    }
  };

  const handleSyncAllIntegrations = async () => {
    setSyncingAllIntegrations(true);
    try {
      const response = await fetch('/api/admin/integrations/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      toast({
        title: 'Sincronização iniciada',
        description: 'A sincronização de todas as integrações foi iniciada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchIntegrations(); // Recarregar status
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao sincronizar todas as integrações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSyncingAllIntegrations(false);
    }
  };

  // --- Funções de Importação ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImportData = async () => {
    if (!importWeekId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma semana para importar os dados.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (importMethod === 'file' && !selectedFile) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo para importar.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsImporting(true);
    try {
      let fileContent: string | ArrayBuffer | null = null;
      if (importMethod === 'file' && selectedFile) {
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result || null);
          reader.onerror = (e) => reject(e);
          if (importPlatform === 'myprio' || importPlatform === 'viaverde') {
            reader.readAsArrayBuffer(selectedFile); // Para XLSX
          } else {
            reader.readAsText(selectedFile); // Para CSV
          }
        });
      }

      let apiUrl = '';
      let body: any = { weekId: importWeekId };

      if (importMethod === 'file') {
        apiUrl = `/api/admin/data/import/${importPlatform}`;
        if (importPlatform === 'myprio' || importPlatform === 'viaverde') {
          body.fileContentBase64 = Buffer.from(fileContent as ArrayBuffer).toString('base64');
        } else {
          body.fileContent = fileContent;
        }
      } else {
        // TODO: Implementar importação via API (se houver)
        toast({
          title: 'Funcionalidade em desenvolvimento',
          description: 'Importação via API ainda não implementada.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        setIsImporting(false);
        return;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message || 'Dados importados com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadWeeklyData(); // Recarregar lista de semanas
        onImportModalClose();
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast({
          title: 'Erro na importação',
          description: result.error || 'Não foi possível importar os dados.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error('Error during import:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro interno ao importar dados.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsImporting(false);
    }
  };

  // --- Renderização ---
  return (
    <AdminLayout
      title={tAdmin('data.title') || 'Gestão de Dados'}
      subtitle={tAdmin('data.subtitle') || 'Monitorize e gerencie as fontes de dados semanais e integrações'}
      breadcrumbs={[
        { label: 'Dados' }
      ]}
    >
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>
            <Icon as={FiDatabase} mr={2} />
            {tAdmin('data.tab.weekly_data') || 'Dados Semanais'}
          </Tab>
          <Tab>
            <Icon as={FiServer} mr={2} />
            {tAdmin('data.tab.integrations') || 'Integrações'}
          </Tab>
        </TabList>

        <TabPanels>
          {/* Tab 1: Dados Semanais */}
          <TabPanel>
            <Box mb={6}>
              <HStack justify="space-between" mb={4}>
                <VStack align="start" spacing={1}>
                  <Heading size="lg">
                    {tAdmin('data.weekly_sources') || 'Fontes de Dados Semanaais'}
                  </Heading>
                  <Text color="gray.600">
                    {tAdmin('data.description') || 'Acompanhe o status das integrações e sincronizações de dados'}
                  </Text>
                </VStack>

                <HStack>
                  <Button
                    leftIcon={<Icon as={FiRefreshCw} />}
                    onClick={loadWeeklyData}
                    isLoading={loadingWeeks}
                    variant="outline"
                  >
                    {t('common.refresh') || 'Atualizar'}
                  </Button>

                  <Button
                    leftIcon={<Icon as={FiUpload} />}
                    onClick={onImportModalOpen}
                    colorScheme="green"
                  >
                    {tAdmin('data.import.button') || 'Nova Importação'}
                  </Button>
                </HStack>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
                <Stat>
                  <StatLabel>{tAdmin('data.stats.total') || 'Total de Semanas'}</StatLabel>
                  <StatNumber>{weeks.length}</StatNumber>
                </Stat>

                <Stat>
                  <StatLabel>{tAdmin('data.stats.complete') || 'Completas'}</StatLabel>
                  <StatNumber color="green.500">{completeWeeks}</StatNumber>
                </Stat>

                <Stat>
                  <StatLabel>{tAdmin('data.stats.partial') || 'Parciais'}</StatLabel>
                  <StatNumber color="yellow.500">{partialWeeks}</StatNumber>
                </Stat>

                <Stat>
                  <StatLabel>{tAdmin('data.stats.pending') || 'Pendentes'}</StatLabel>
                  <StatNumber color="red.500">{pendingWeeks}</StatNumber>
                </Stat>
              </SimpleGrid>
            </Box>

            {loadingWeeks ? (
              <Box textAlign="center" py={10}>
                <Spinner size="xl" color="blue.500" />
                <Text mt={4} color="gray.600">
                  {t('common.loading') || 'A carregar...'}
                </Text>
              </Box>
            ) : weeks.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>{tAdmin('data.no_data.title') || 'Nenhum dado encontrado'}</AlertTitle>
                <AlertDescription>
                  {tAdmin('data.no_data.desc') || 'Não foram encontrados dados semanais. Execute uma sincronização para começar.'}
                </AlertDescription>
              </Alert>
            ) : (
              <VStack spacing={4} align="stretch">
                {weeks.map((week) => (
                  <Card key={week.weekId} variant="outline">
                    <CardBody>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Text fontWeight="semibold">
                              {tAdmin('data.week') || 'Semana'} {week.weekId}
                            </Text>
                            <Badge colorScheme={getStatusColor(week.isComplete ? 'complete' : (Object.values(week.sources).some(s => s.status === 'partial') ? 'partial' : 'pending'))}>
                              {getStatusLabel(week.isComplete ? 'complete' : (Object.values(week.sources).some(s => s.status === 'partial') ? 'partial' : 'pending'))}
                            </Badge>
                          </HStack>

                          <Text fontSize="sm" color="gray.600">
                            {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                          </Text>

                          {week.updatedAt && (
                            <Text fontSize="xs" color="gray.500">
                              {tAdmin("data.last_sync") || "Última sincronização"}: {formatDate(week.updatedAt)}
                            </Text>
                          )}
                        </VStack>

                        <HStack>
                          <Icon
                            as={week.isComplete ? FiCheckCircle : FiAlertCircle}
                            color={week.isComplete ? 'green.500' : 'yellow.500'}
                            boxSize={5}
                          />

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/weekly?week=${week.weekId}`)}
                          >
                            {tAdmin('data.view_details') || 'Ver Detalhes'}
                          </Button>
                        </HStack>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </TabPanel>

          {/* Tab 2: Integrações */}
          <TabPanel>
            <Box mb={6}>
              <HStack justify="space-between" mb={4}>
                <VStack align="start" spacing={1}>
                  <Heading size="lg">
                    {tAdmin('integrations.title') || 'Integrações de Plataformas'}
                  </Heading>
                  <Text color="gray.600">
                    {tAdmin('integrations.subtitle') || 'Conecte e gerencie suas plataformas de serviço de transporte'}
                  </Text>
                </VStack>

                <HStack>
                  <Button
                    leftIcon={<Icon as={FiRefreshCw} />}
                    onClick={fetchIntegrations}
                    isLoading={loadingWeeks} // Reutilizando loadingWeeks, idealmente seria loadingIntegrations
                    variant="outline"
                  >
                    {t('common.refresh') || 'Atualizar'}
                  </Button>
                  <Button
                    leftIcon={<Icon as={FiActivity} />}
                    onClick={handleTestAllIntegrations}
                    isLoading={testingAllIntegrations}
                    colorScheme="yellow"
                  >
                    {tAdmin('integrations.test_all') || 'Testar Todas'}
                  </Button>
                  <Button
                    leftIcon={<Icon as={FiTrendingUp} />}
                    onClick={handleSyncAllIntegrations}
                    isLoading={syncingAllIntegrations}
                    colorScheme="green"
                  >
                    {tAdmin('integrations.sync_all') || 'Sincronizar Todas'}
                  </Button>
                </HStack>
              </HStack>
            </Box>

            {loadingWeeks ? (
              <Center py={10}>
                <Spinner size="xl" color="blue.500" />
                <Text mt={4} color="gray.600">{t('common.loading') || 'A carregar integrações...'}</Text>
              </Center>
            ) : integrations.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>{tAdmin('integrations.no_integrations.title') || 'Nenhuma integração encontrada'}</AlertTitle>
                <AlertDescription>
                  {tAdmin('integrations.no_integrations.desc') || 'Configure suas integrações para começar a gerenciar dados.'}
                </AlertDescription>
              </Alert>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {integrations.map((integration) => (
                  <Card key={integration.id} variant="outline">
                    <CardHeader>
                      <HStack justify="space-between">
                        <Heading size="md">{integration.name}</Heading>
                        <Badge
                          colorScheme={integration.status === 'connected' ? 'green' : integration.status === 'error' ? 'red' : 'gray'}
                        >
                          {integration.status === 'connected' ? tAdmin('integrations.status.connected') || 'Conectado' : integration.status === 'error' ? tAdmin('integrations.status.error') || 'Erro' : tAdmin('integrations.status.disconnected') || 'Desconectado'}
                        </Badge>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm" color="gray.600">{integration.description}</Text>
                        {integration.lastSync && (
                          <Text fontSize="xs" color="gray.500">
                            {tAdmin('integrations.last_sync') || 'Última sincronização'}: {new Date(integration.lastSync).toLocaleString(locale)}
                          </Text>
                        )}
                        {integration.errorMessage && (
                          <Alert status="error" variant="left-accent" py={1} px={2} borderRadius="md">
                            <AlertIcon boxSize={3} />
                            <Text fontSize="xs">{integration.errorMessage}</Text>
                          </Alert>
                        )}
                        <HStack mt={4}>
                          <Button
                            leftIcon={<Icon as={FiSettings} />}
                            size="sm"
                            onClick={() => handleOpenConfig(integration)}
                          >
                            {t('common.configure') || 'Configurar'}
                          </Button>
                          <Button
                            leftIcon={<Icon as={FiWifi} />}
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestConnection(integration)}
                            isLoading={integration.status === 'syncing'}
                          >
                            {t('common.test') || 'Testar'}
                          </Button>
                          <Button
                            leftIcon={<Icon as={FiDatabase} />}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDataView(integration);
                              onDataModalOpen();
                            }}
                          >
                            {t('common.view_data') || 'Ver Dados'}
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}

            {/* Modal de Configuração */}
            <Modal isOpen={isConfigModalOpen} onClose={onConfigModalClose}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>{tAdmin('integrations.config_modal.title') || 'Configurar Integração'}: {selectedIntegration?.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <FormControl display="flex" alignItems="center" mb={4}>
                    <FormLabel htmlFor="integration-active" mb="0">
                      {tAdmin('integrations.config_modal.active') || 'Ativar Integração'}
                    </FormLabel>
                    <Switch
                      id="integration-active"
                      isChecked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      colorScheme="green"
                    />
                  </FormControl>
                  <Divider mb={4} />
                  {renderCredentialFields()}
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={onConfigModalClose}>
                    {t('common.cancel') || 'Cancelar'}
                  </Button>
                  <Button colorScheme="blue" onClick={handleSaveConfig} isLoading={isSavingIntegration}>
                    {t('common.save') || 'Salvar'}
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Modal de Visualização de Dados (TODO: Implementar) */}
            <Modal isOpen={isDataModalOpen} onClose={onDataModalClose} size="full">
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>{tAdmin('integrations.data_modal.title') || 'Dados da Integração'}: {selectedDataView?.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Text>Aqui você verá os dados brutos importados da integração {selectedDataView?.name}.</Text>
                  <Code whiteSpace="pre-wrap" mt={4} p={4} bg="gray.50" borderRadius="md" maxH="70vh" overflowY="auto">
                    {JSON.stringify(integrationData, null, 2)}
                  </Code>
                </ModalBody>
                <ModalFooter>
                  <Button onClick={onDataModalClose}>{t('common.close') || 'Fechar'}</Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal de Importação */}
      <Modal isOpen={isImportModalOpen} onClose={onImportModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{tAdmin('data.import_modal.title') || 'Importar Dados'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>{tAdmin('data.import_modal.week') || 'Semana'}</FormLabel>
              <Input
                type="week"
                value={importWeekId}
                onChange={(e) => setImportWeekId(e.target.value)}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>{tAdmin('data.import_modal.method') || 'Método de Importação'}</FormLabel>
              <Select
                value={importMethod}
                onChange={(e) => setImportMethod(e.target.value as 'file' | 'api')}
              >
                <option value="file">{tAdmin('data.import_modal.method_file') || 'Via Arquivo'}</option>
                <option value="api" disabled>{tAdmin('data.import_modal.method_api') || 'Via API (Em Breve)'}</option>
              </Select>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>{tAdmin('data.import_modal.platform') || 'Plataforma'}</FormLabel>
              <Select
                value={importPlatform}
                onChange={(e) => setImportPlatform(e.target.value as 'uber' | 'bolt' | 'myprio' | 'viaverde')}
              >
                <option value="uber">Uber</option>
                <option value="bolt">Bolt</option>
                <option value="myprio">MyPrio</option>
                <option value="viaverde">Via Verde</option>
              </Select>
            </FormControl>

            {importMethod === 'file' && (
              <FormControl mb={4}>
                <FormLabel>{tAdmin('data.import_modal.file') || 'Arquivo'}</FormLabel>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={importPlatform === 'myprio' || importPlatform === 'viaverde' ? '.xlsx' : '.csv'}
                />
                {selectedFile && <Text mt={2} fontSize="sm">Arquivo selecionado: {selectedFile.name}</Text>}
              </FormControl>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onImportModalClose}>
              {t('common.cancel') || 'Cancelar'}
            </Button>
            <Button colorScheme="blue" onClick={handleImportData} isLoading={isImporting}>
              {tAdmin('data.import_modal.import_button') || 'Importar'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR<DataPageProps>(async (context, user) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cookieHeader = context.req.headers.cookie || '';

  try {
    // Fetch initialWeeks
    const weeksResponse = await fetch(`${baseUrl}/api/admin/weekly/data-sources`, {
      headers: { Cookie: cookieHeader },
    });
    const weeksData = await weeksResponse.json();
    const initialWeeks = weeksData.weeks || [];

    // Fetch initialIntegrations
    const integrationsResponse = await fetch(`${baseUrl}/api/admin/integrations`, {
      headers: { Cookie: cookieHeader },
    });
    const integrationsData = await integrationsResponse.json();
    const initialIntegrations = integrationsData.integrations || [];

    return {
      props: {
        initialWeeks,
        initialIntegrations,
      },
    };
  } catch (error) {
    console.error('Error fetching initial data for data.tsx:', error);
    return {
      props: {
        initialWeeks: [],
        initialIntegrations: [],
      },
    };
  }
});

