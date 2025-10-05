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
} from '@chakra-ui/react';
import { 
  FiWifi,
  FiWifiOff,
  FiRefreshCw,
  FiSettings,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiActivity
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
  
  const toast = useToast();

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

  return (
    <LoggedInLayout>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <Box>
              <Heading size="lg">{tAdmin('integrations.title')}</Heading>
              <Text color="gray.600">{tAdmin('integrations.subtitle')}</Text>
            </Box>
            <HStack>
              <Button
                leftIcon={<Icon as={FiActivity} />}
                onClick={handleTestAllConnections}
                isLoading={testingAll}
                loadingText="Testando..."
                colorScheme="blue"
                variant="outline"
              >
                {tAdmin('integrations.testAllConnections')}
              </Button>
              <Button
                leftIcon={<Icon as={FiRefreshCw} />}
                onClick={handleSyncAllData}
                isLoading={syncingAll}
                loadingText="Sincronizando..."
                colorScheme="green"
              >
                {tAdmin('integrations.syncAllData')}
              </Button>
            </HStack>
          </HStack>

          {/* Resumo do Status */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Total Integrações</Text>
                  <Text fontSize="2xl" fontWeight="bold">{integrations.length}</Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Conectadas</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {connectedCount}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Com Erro</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="red.500">
                    {errorCount}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Taxa de Sucesso</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {integrations.length > 0 ? Math.round((connectedCount / integrations.length) * 100) : 0}%
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

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

                    <HStack justify="space-between">
                      <Button
                        size="sm"
                        leftIcon={<Icon as={FiSettings} />}
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: 'Configurações',
                            description: `Abrindo configurações para ${integration.name}`,
                            status: 'info',
                            duration: 2000,
                            isClosable: true,
                          });
                        }}
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
          id: 'fonoa',
          name: 'FONOA',
          description: 'Integração com FONOA para faturação',
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
