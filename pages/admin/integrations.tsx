import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Icon,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Progress,
  Divider,
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  Textarea,
  InputGroup,
  InputRightElement,
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { 
  FiWifi,
  FiWifiOff,
  FiRefreshCw,
  FiSettings,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiActivity,
  FiEye,
  FiEyeOff,
  FiDatabase,
  FiServer,
  FiClock,
  FiTrendingUp,
} from 'react-icons/fi';
import { loadTranslations, getTranslation } from '@/lib/translations';
import LoggedInLayout from '@/components/LoggedInLayout';
import { ADMIN } from '@/translations';
import { PageProps } from '@/interface/Global';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  errorMessage?: string;
  credentials?: any;
  config?: any;
  isActive?: boolean;
}

interface AdminIntegrationsProps extends PageProps {
  translations: {
    common: any;
    page: any;
  };
  locale: string;
  integrations: Integration[];
}

export default function AdminIntegrations({ translations, locale, tCommon, tPage, integrations: initialIntegrations }: AdminIntegrationsProps) {
  const t = tCommon || ((key: string) => getTranslation(translations.common, key));
  const tAdmin = tPage || ((key: string) => getTranslation(translations.page, key));
  
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [testingAll, setTestingAll] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [fullIntegrationData, setFullIntegrationData] = useState<any>(null);
  const [selectedDataView, setSelectedDataView] = useState<Integration | null>(null);
  const [integrationData, setIntegrationData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDataOpen, onOpen: onDataOpen, onClose: onDataClose } = useDisclosure();
  const toast = useToast();

  // Abrir modal de configuração
  const handleOpenConfig = async (integration: Integration) => {
    setSelectedIntegration(integration);
    
    // Buscar credenciais do Firestore
    try {
      const response = await fetch(`/api/admin/integrations/${integration.id}`);
      const data = await response.json();
      
      if (data.success) {
        // Salvar dados completos para exibir nas abas
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
      console.error('Error loading integration:', error);
      setFormData({ isActive: false });
      setFullIntegrationData(null);
    }
    
    onOpen();
  };

  // Salvar configurações
  const handleSaveConfig = async () => {
    if (!selectedIntegration) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/integrations/${selectedIntegration.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentials: getCredentialsFromForm(selectedIntegration.id),
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Sucesso!',
          description: `Configurações de ${selectedIntegration.name} salvas`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Atualizar lista
        setIntegrations(prev => prev.map(int => 
          int.id === selectedIntegration.id 
            ? { ...int, isActive: formData.isActive }
            : int
        ));
        
        onClose();
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao salvar configurações',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Extrair credenciais do formulário baseado na plataforma
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

  // Renderizar campos do formulário baseado na plataforma
  const renderCredentialFields = () => {
    if (!selectedIntegration) return null;

    const togglePassword = (field: string) => {
      setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    switch (selectedIntegration.id) {
      case 'cartrack':
        return (
          <>
            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Digite o username"
              />
            </FormControl>
            <FormControl>
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
            <FormControl>
              <FormLabel>Client ID</FormLabel>
              <Input
                value={formData.clientId || ''}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="Digite o Client ID"
              />
            </FormControl>
            <FormControl>
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
              <FormControl>
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
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Digite o email"
              />
            </FormControl>
            <FormControl>
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
            <FormControl>
              <FormLabel>Account ID</FormLabel>
              <Input
                value={formData.accountId || ''}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                placeholder="Digite o Account ID"
              />
            </FormControl>
            <FormControl>
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

  const handleTestAllConnections = async () => {
    setTestingAll(true);
    try {
      // Testar todas as conexões
      for (const integration of integrations) {
        await handleTestConnection(integration);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre testes
      }
      
      toast({
        title: 'Teste completo',
        description: 'Todos os testes de conexão foram executados',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTestingAll(false);
    }
  };

  const handleSyncAllData = async () => {
    setSyncingAll(true);
    try {
      const response = await fetch('/api/admin/integrations/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setIntegrations(prev => prev.map(int => 
          int.status === 'connected' 
            ? { ...int, lastSync: new Date().toISOString() }
            : int
        ));

        toast({
          title: 'Sincronização concluída',
          description: `${data.synced} integração(ões) sincronizada(s) com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Erro na sincronização',
          description: data.error || 'Falha ao sincronizar dados',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro na sincronização',
        description: 'Falha ao sincronizar alguns dados',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'green';
      case 'disconnected': return 'gray';
      case 'error': return 'red';
      case 'syncing': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return FiCheck;
      case 'disconnected': return FiWifiOff;
      case 'error': return FiX;
      case 'syncing': return FiRefreshCw;
      default: return FiWifiOff;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return tAdmin('integrations.status.connected');
      case 'disconnected': return tAdmin('integrations.status.disconnected');
      case 'error': return tAdmin('integrations.status.error');
      case 'syncing': return tAdmin('integrations.status.syncing');
      default: return status;
    }
  };

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dias atrás`;
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;

  // Buscar dados reais da integração
  const handleViewData = async (integration: Integration) => {
    setSelectedDataView(integration);
    setLoadingData(true);
    onDataOpen();

    try {
      const response = await fetch(`/api/admin/integrations/${integration.id}/data`);
      const data = await response.json();

      if (data.success) {
        setIntegrationData(data.data);
      } else {
        toast({
          title: 'Erro ao carregar dados',
          description: data.error || 'Não foi possível carregar os dados',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIntegrationData(null);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao buscar dados da integração',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIntegrationData(null);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <LoggedInLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header - Estilo Dashboard */}
          <Box>
            <Heading size="xl" mb={2}>
              Integrações TVDE
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Gerencie conexões com plataformas, visualize dados sincronizados e configure credenciais
            </Text>
          </Box>

          {/* KPIs Principais - Estilo Dashboard */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {/* Total Integrações */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <StatLabel>Total de Integrações</StatLabel>
                    <Icon as={FiServer} color="blue.500" boxSize={5} />
                  </HStack>
                  <StatNumber fontSize="3xl" color="blue.600">
                    {integrations.length}
                  </StatNumber>
                  <StatHelpText>
                    6 plataformas disponíveis
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            {/* Conectadas */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <StatLabel>Conectadas</StatLabel>
                    <Icon as={FiWifi} color="green.500" boxSize={5} />
                  </HStack>
                  <StatNumber fontSize="3xl" color="green.600">
                    {connectedCount}
                  </StatNumber>
                  <StatHelpText>
                    Funcionando normalmente
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            {/* Com Erro */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <StatLabel>Com Erro</StatLabel>
                    <Icon as={FiAlertTriangle} color="red.500" boxSize={5} />
                  </HStack>
                  <StatNumber fontSize="3xl" color="red.600">
                    {errorCount}
                  </StatNumber>
                  <StatHelpText>
                    Requer atenção
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            {/* Taxa de Sucesso */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <StatLabel>Taxa de Sucesso</StatLabel>
                    <Icon as={FiTrendingUp} color="purple.500" boxSize={5} />
                  </HStack>
                  <StatNumber fontSize="3xl" color="purple.600">
                    {integrations.length > 0 ? Math.round((connectedCount / integrations.length) * 100) : 0}%
                  </StatNumber>
                  <StatHelpText>
                    Performance geral
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Botões de Ação */}
          <HStack justify="flex-end">
            <Button
              leftIcon={<Icon as={FiActivity} />}
              onClick={handleTestAllConnections}
              isLoading={testingAll}
              loadingText="Testando..."
              colorScheme="blue"
              variant="outline"
            >
              Testar Todas
            </Button>
            <Button
              leftIcon={<Icon as={FiRefreshCw} />}
              onClick={handleSyncAllData}
              isLoading={syncingAll}
              loadingText="Sincronizando..."
              colorScheme="green"
            >
              Sincronizar Todas
            </Button>
          </HStack>

          {/* Alertas */}
          {errorCount > 0 && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Problemas nas Integrações</Text>
                <Text fontSize="sm">
                  {errorCount} integração(ões) com erro. Verifique as configurações e credenciais.
                </Text>
              </Box>
            </Alert>
          )}

          {/* Cards das Integrações */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {integrations.map((integration) => (
              <Card key={integration.id} borderWidth={1} borderColor="gray.200">
                <CardHeader>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon 
                        as={getStatusIcon(integration.status)} 
                        color={`${getStatusColor(integration.status)}.500`}
                        boxSize={6}
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="lg">
                          {integration.name}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {integration.description}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge colorScheme={getStatusColor(integration.status)}>
                      {getStatusText(integration.status)}
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        {tAdmin('integrations.uber.lastSync')}:
                      </Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {formatLastSync(integration.lastSync)}
                      </Text>
                    </HStack>

                    {integration.status === 'syncing' && (
                      <Box>
                        <Text fontSize="sm" color="blue.600" mb={2}>
                          Sincronizando dados...
                        </Text>
                        <Progress size="sm" isIndeterminate colorScheme="blue" />
                      </Box>
                    )}

                    {integration.errorMessage && (
                      <Alert status="error" size="sm" borderRadius="md">
                        <AlertIcon />
                        <Text fontSize="xs">{integration.errorMessage}</Text>
                      </Alert>
                    )}

                    <HStack justify="space-between" spacing={2}>
                      <Button
                        size="sm"
                        leftIcon={<Icon as={FiDatabase} />}
                        variant="outline"
                        colorScheme="purple"
                        onClick={() => handleViewData(integration)}
                        isDisabled={integration.status !== 'connected'}
                      >
                        Ver Dados
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<Icon as={FiSettings} />}
                        variant="outline"
                        onClick={() => handleOpenConfig(integration)}
                      >
                        Configurar
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<Icon as={getStatusIcon(integration.status)} />}
                        colorScheme={integration.status === 'connected' ? 'green' : 'blue'}
                        onClick={() => handleTestConnection(integration)}
                        isLoading={integration.status === 'syncing'}
                      >
                        {integration.status === 'connected' ? 'Testar' : 'Conectar'}
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Informações Adicionais */}
          <Card>
            <CardHeader>
              <Heading size="md">Informações sobre Integrações</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="medium" mb={2}>Status das Integrações:</Text>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Badge colorScheme="green">Conectado</Badge>
                      <Text fontSize="sm">Integração funcionando normalmente</Text>
                    </HStack>
                    <HStack>
                      <Badge colorScheme="gray">Desconectado</Badge>
                      <Text fontSize="sm">Integração não configurada ou inativa</Text>
                    </HStack>
                    <HStack>
                      <Badge colorScheme="red">Erro</Badge>
                      <Text fontSize="sm">Problema na conexão - verifique configurações</Text>
                    </HStack>
                    <HStack>
                      <Badge colorScheme="blue">Sincronizando</Badge>
                      <Text fontSize="sm">Integração está sincronizando dados</Text>
                    </HStack>
                  </VStack>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="medium" mb={2}>Ações Disponíveis:</Text>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm">• <strong>Testar Conexão:</strong> Verifica se a integração está funcionando</Text>
                    <Text fontSize="sm">• <strong>Configurar:</strong> Acessa as configurações da integração</Text>
                    <Text fontSize="sm">• <strong>Sincronizar Todos:</strong> Força sincronização de todas as integrações conectadas</Text>
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Modal de Visualização de Dados */}
      <Modal isOpen={isDataOpen} onClose={onDataClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <HStack>
              <Icon as={FiDatabase} color="purple.500" />
              <Text>Dados Recebidos - {selectedDataView?.name}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            {loadingData ? (
              <Center py={10}>
                <VStack spacing={4}>
                  <Spinner size="xl" color="purple.500" />
                  <Text>Carregando dados...</Text>
                </VStack>
              </Center>
            ) : integrationData ? (
              <VStack spacing={6} align="stretch">
                {/* Resumo */}
                <Card bg="purple.50">
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold" fontSize="lg">Resumo dos Dados</Text>
                        <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                          {integrationData.count || 0} registros
                        </Badge>
                      </HStack>
                      {integrationData.lastUpdate && (
                        <HStack>
                          <Icon as={FiClock} color="gray.500" />
                          <Text fontSize="sm" color="gray.600">
                            Última atualização: {new Date(integrationData.lastUpdate).toLocaleString('pt-PT')}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Dados em JSON formatado */}
                <Box>
                  <Text fontWeight="bold" mb={3}>Dados Completos (JSON):</Text>
                  <Code
                    display="block"
                    whiteSpace="pre"
                    p={4}
                    borderRadius="md"
                    maxH="500px"
                    overflowY="auto"
                    fontSize="xs"
                  >
                    {JSON.stringify(integrationData, null, 2)}
                  </Code>
                </Box>

                {/* Informação adicional */}
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontSize="sm">
                      Estes são os dados mais recentes sincronizados da integração <strong>{selectedDataView?.name}</strong>.
                      Para atualizar, use o botão "Sincronizar" no card da integração.
                    </Text>
                  </Box>
                </Alert>
              </VStack>
            ) : (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Nenhum dado disponível</Text>
                  <Text fontSize="sm">
                    Ainda não há dados sincronizados para esta integração. 
                    Teste a conexão primeiro e depois sincronize os dados.
                  </Text>
                </Box>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDataClose}>Fechar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Configuração */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            Configurar {selectedIntegration?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            <Tabs colorScheme="blue">
              <TabList>
                <Tab>🔑 Credenciais</Tab>
                <Tab>🌐 Configuração</Tab>
                <Tab>📊 Estatísticas</Tab>
                <Tab>🔐 OAuth</Tab>
                <Tab>📝 Metadados</Tab>
              </TabList>

              <TabPanels>
                {/* ABA 1: CREDENCIAIS */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {/* Switch para ativar/desativar */}
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">
                        Integração Ativa
                      </FormLabel>
                      <Switch
                        isChecked={formData.isActive || false}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        colorScheme="green"
                      />
                    </FormControl>

                    <Divider />

                    {/* Campos de credenciais com toggle de visibilidade */}
                    {renderCredentialFields()}

                    {/* Alerta de segurança */}
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <Text fontSize="sm">
                          <strong>Nota:</strong> As credenciais são armazenadas de forma segura no Firestore e usadas apenas para autenticação com as APIs externas.
                        </Text>
                      </Box>
                    </Alert>
                  </VStack>
                </TabPanel>

                {/* ABA 2: CONFIGURAÇÃO */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {fullIntegrationData?.config && (
                      <>
                        <FormControl>
                          <FormLabel>Base URL</FormLabel>
                          <Input value={fullIntegrationData.config.baseUrl || ''} isReadOnly />
                        </FormControl>
                        
                        {fullIntegrationData.config.authUrl && (
                          <FormControl>
                            <FormLabel>Auth URL</FormLabel>
                            <Input value={fullIntegrationData.config.authUrl} isReadOnly />
                          </FormControl>
                        )}
                        
                        {fullIntegrationData.config.tokenUrl && (
                          <FormControl>
                            <FormLabel>Token URL</FormLabel>
                            <Input value={fullIntegrationData.config.tokenUrl} isReadOnly />
                          </FormControl>
                        )}
                        
                        {fullIntegrationData.config.endpoints && (
                          <FormControl>
                            <FormLabel>Endpoints</FormLabel>
                            <Code display="block" p={3} borderRadius="md" whiteSpace="pre">
                              {JSON.stringify(fullIntegrationData.config.endpoints, null, 2)}
                            </Code>
                          </FormControl>
                        )}
                        
                        {fullIntegrationData.config.options && (
                          <FormControl>
                            <FormLabel>Opções</FormLabel>
                            <Code display="block" p={3} borderRadius="md" whiteSpace="pre">
                              {JSON.stringify(fullIntegrationData.config.options, null, 2)}
                            </Code>
                          </FormControl>
                        )}
                      </>
                    )}
                  </VStack>
                </TabPanel>

                {/* ABA 3: ESTATÍSTICAS */}
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Stat>
                      <StatLabel>Total de Requisições</StatLabel>
                      <StatNumber>{fullIntegrationData?.stats?.totalRequests || 0}</StatNumber>
                      <StatHelpText>Desde a criação</StatHelpText>
                    </Stat>
                    
                    <Stat>
                      <StatLabel>Requisições com Sucesso</StatLabel>
                      <StatNumber color="green.500">
                        {fullIntegrationData?.stats?.successfulRequests || 0}
                      </StatNumber>
                      <StatHelpText>
                        {fullIntegrationData?.stats?.totalRequests > 0
                          ? `${Math.round((fullIntegrationData.stats.successfulRequests / fullIntegrationData.stats.totalRequests) * 100)}%`
                          : '0%'}
                      </StatHelpText>
                    </Stat>
                    
                    <Stat>
                      <StatLabel>Requisições Falhadas</StatLabel>
                      <StatNumber color="red.500">
                        {fullIntegrationData?.stats?.failedRequests || 0}
                      </StatNumber>
                      <StatHelpText>
                        {fullIntegrationData?.stats?.totalRequests > 0
                          ? `${Math.round((fullIntegrationData.stats.failedRequests / fullIntegrationData.stats.totalRequests) * 100)}%`
                          : '0%'}
                      </StatHelpText>
                    </Stat>
                  </SimpleGrid>

                  <Divider my={6} />

                  <VStack spacing={3} align="stretch">
                    {fullIntegrationData?.stats?.lastSync && (
                      <HStack>
                        <Text fontWeight="medium">Última Sincronização:</Text>
                        <Text>{new Date(fullIntegrationData.stats.lastSync).toLocaleString('pt-PT')}</Text>
                      </HStack>
                    )}
                    
                    {fullIntegrationData?.stats?.lastSuccess && (
                      <HStack>
                        <Text fontWeight="medium">Último Sucesso:</Text>
                        <Text>{new Date(fullIntegrationData.stats.lastSuccess).toLocaleString('pt-PT')}</Text>
                      </HStack>
                    )}
                    
                    {fullIntegrationData?.stats?.lastError && (
                      <HStack>
                        <Text fontWeight="medium">Último Erro:</Text>
                        <Text>{new Date(fullIntegrationData.stats.lastError).toLocaleString('pt-PT')}</Text>
                      </HStack>
                    )}
                    
                    {fullIntegrationData?.stats?.errorMessage && (
                      <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        <Box>
                          <Text fontSize="sm" fontWeight="bold">Mensagem de Erro:</Text>
                          <Text fontSize="sm">{fullIntegrationData.stats.errorMessage}</Text>
                        </Box>
                      </Alert>
                    )}
                  </VStack>
                </TabPanel>

                {/* ABA 4: OAUTH */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {fullIntegrationData?.oauth ? (
                      <>
                        {fullIntegrationData.oauth.accessToken && (
                          <FormControl>
                            <FormLabel>Access Token</FormLabel>
                            <Textarea
                              value={fullIntegrationData.oauth.accessToken}
                              isReadOnly
                              rows={3}
                              fontSize="xs"
                              fontFamily="mono"
                            />
                          </FormControl>
                        )}
                        
                        {fullIntegrationData.oauth.refreshToken && (
                          <FormControl>
                            <FormLabel>Refresh Token</FormLabel>
                            <Textarea
                              value={fullIntegrationData.oauth.refreshToken}
                              isReadOnly
                              rows={3}
                              fontSize="xs"
                              fontFamily="mono"
                            />
                          </FormControl>
                        )}
                        
                        {fullIntegrationData.oauth.tokenType && (
                          <FormControl>
                            <FormLabel>Token Type</FormLabel>
                            <Input value={fullIntegrationData.oauth.tokenType} isReadOnly />
                          </FormControl>
                        )}
                        
                        {fullIntegrationData.oauth.expiresAt && (
                          <FormControl>
                            <FormLabel>Expira em</FormLabel>
                            <Input
                              value={new Date(fullIntegrationData.oauth.expiresAt).toLocaleString('pt-PT')}
                              isReadOnly
                            />
                          </FormControl>
                        )}
                        
                        {fullIntegrationData.oauth.scope && (
                          <FormControl>
                            <FormLabel>Scope</FormLabel>
                            <Input value={fullIntegrationData.oauth.scope} isReadOnly />
                          </FormControl>
                        )}
                      </>
                    ) : (
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <Text>Esta integração não usa OAuth ou ainda não foi autorizada.</Text>
                      </Alert>
                    )}
                  </VStack>
                </TabPanel>

                {/* ABA 5: METADADOS */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Status</FormLabel>
                      <Badge
                        colorScheme={
                          fullIntegrationData?.status === 'connected' ? 'green' :
                          fullIntegrationData?.status === 'error' ? 'red' :
                          fullIntegrationData?.status === 'pending' ? 'yellow' : 'gray'
                        }
                        fontSize="md"
                        p={2}
                      >
                        {fullIntegrationData?.status || 'N/A'}
                      </Badge>
                    </FormControl>
                    
                    {fullIntegrationData?.createdAt && (
                      <FormControl>
                        <FormLabel>Criado em</FormLabel>
                        <Input
                          value={new Date(fullIntegrationData.createdAt).toLocaleString('pt-PT')}
                          isReadOnly
                        />
                      </FormControl>
                    )}
                    
                    {fullIntegrationData?.updatedAt && (
                      <FormControl>
                        <FormLabel>Atualizado em</FormLabel>
                        <Input
                          value={new Date(fullIntegrationData.updatedAt).toLocaleString('pt-PT')}
                          isReadOnly
                        />
                      </FormControl>
                    )}
                    
                    {fullIntegrationData?.createdBy && (
                      <FormControl>
                        <FormLabel>Criado por</FormLabel>
                        <Input value={fullIntegrationData.createdBy} isReadOnly />
                      </FormControl>
                    )}
                    
                    {fullIntegrationData?.updatedBy && (
                      <FormControl>
                        <FormLabel>Atualizado por</FormLabel>
                        <Input value={fullIntegrationData.updatedBy} isReadOnly />
                      </FormControl>
                    )}
                    
                    <Divider />
                    
                    <FormControl>
                      <FormLabel>ID da Integração</FormLabel>
                      <Code display="block" p={2} borderRadius="md">
                        {selectedIntegration?.id}
                      </Code>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Nome</FormLabel>
                      <Input value={fullIntegrationData?.name || selectedIntegration?.name} isReadOnly />
                    </FormControl>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveConfig}
              isLoading={isSaving}
            >
              Salvar Configurações
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LoggedInLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);
  
  // Se não está autenticado, retorna o redirect
  if ('redirect' in authResult) {
    return authResult;
  }

  try {
    const { fetchUnifiedAdminData } = await import('@/lib/admin/unified-data');
    
    // Buscar dados unificados incluindo apenas integrations
    const unifiedData = await fetchUnifiedAdminData({
      includeDrivers: false,
      includeVehicles: false,
      includeFleetRecords: false,
      includeIntegrations: true,
      includeRequests: false,
      includeWeeklyRecords: false,
    });

    // Converter para formato esperado pelo componente
    const integrations = unifiedData.integrations.map(integration => ({
      id: integration.id,
      name: integration.name,
      description: `Integração com ${integration.name}`,
      status: integration.status,
      lastSync: integration.lastSync || null,
      errorMessage: integration.lastError || null,
    }));

    // Se não houver integrações, criar as padrão
    if (integrations.length === 0) {
      const { adminDb } = await import('@/lib/firebaseAdmin');
      const defaultIntegrations = [
        {
          id: 'uber',
          name: 'Uber',
          description: 'Integração com Uber para viagens e ganhos',
          status: 'disconnected',
        },
        {
          id: 'bolt',
          name: 'Bolt',
          description: 'Integração com Bolt para viagens e ganhos',
          status: 'disconnected',
        },
        {
          id: 'cartrack',
          name: 'Cartrack',
          description: 'Integração com Cartrack para dados de veículos',
          status: 'disconnected',
        },
        {
          id: 'viaverde',
          name: 'ViaVerde',
          description: 'Integração com ViaVerde para dados de portagens',
          status: 'disconnected',
        },
        {
          id: 'myprio',
          name: 'myprio',
          description: 'Integração com myprio para despesas de combustível',
          status: 'disconnected',
        },
      ];

      // Criar integrações padrão no Firestore
      for (const integration of defaultIntegrations) {
        await adminDb.collection('integrations').doc(integration.id).set(integration);
      }

      return {
        props: {
          ...authResult.props,
          integrations: defaultIntegrations,
        },
      };
    }

    return {
      props: {
        ...authResult.props,
        integrations,
      },
    };
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return {
      props: {
        ...authResult.props,
        integrations: [],
      },
    };
  }
};
