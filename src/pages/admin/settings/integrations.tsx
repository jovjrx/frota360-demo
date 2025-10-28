import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { formatDateTime } from '@/lib/utils/datetime';

interface IntegrationStatus {
  platform: string;
  enabled: boolean;
  status: 'connected' | 'error' | 'not_configured';
  lastSync: string | null;
  errorMessage: string | null;
  stats?: {
    totalTrips?: number;
    totalVehicles?: number;
    totalDistance?: number;
  };
}

interface IntegrationLog {
  id: string;
  platform: string;
  type: string;
  severity: string;
  message: string;
  details?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  timestamp: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  errorMessage?: string;
  isActive: boolean;
}

export default function IntegrationsPage({ translations }: AdminPageProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const toast = useToast();

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Erro ao buscar integrações:', error);
      toast({ status: 'error', title: 'Erro ao carregar integrações' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (id: string) => {
    setTesting(id);
    try {
      const response = await fetch(`/api/admin/integrations/${id}/test`);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Conexão bem-sucedida!',
          description: 'A integração está funcionando corretamente.',
          status: 'success',
          duration: 5000,
        });
        fetchIntegrations();
      } else {
        toast({
          title: 'Erro na conexão',
          description: result.error || 'Não foi possível conectar.',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao testar conexão',
        description: 'Ocorreu um erro ao tentar conectar.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setTesting(null);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch('/api/admin/integrations/logs?limit=100');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.logs) {
          setLogs(data.logs);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
    fetchLogs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'green';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return FiCheckCircle;
      case 'error':
        return FiXCircle;
      default:
        return FiAlertTriangle;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'error':
        return 'Erro';
      default:
        return 'Não configurado';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
      case 'critical':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'success':
        return 'green';
      default:
        return 'blue';
    }
  };

  return (
    <AdminLayout
      title="Integrações"
      subtitle="Gerencie suas integrações com serviços externos"
      breadcrumbs={[{ label: 'Integrações' }]}
      translations={translations}
    >
      <Box bg="white" borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" overflow="hidden">
        <Tabs>
          <TabList px={6} pt={4}>
            <Tab>Integrações</Tab>
            <Tab>Logs</Tab>
          </TabList>

          <TabPanels>
            {/* TAB: INTEGRAÇÕES */}
            <TabPanel>
              {loading ? (
                <Box textAlign="center" py={10}>
                  <Spinner size="xl" color="green.500" />
                </Box>
              ) : (
                <VStack spacing={6} align="stretch" p={6}>
                  {integrations.length === 0 ? (
                    <Box textAlign="center" py={10}>
                      <Text color="gray.500">Nenhuma integração configurada</Text>
                    </Box>
                  ) : (
                    integrations.map((integration) => (
                      <Box key={integration.id} p={6} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
                        <HStack justify="space-between" mb={4}>
                          <HStack>
                            <Heading fontSize="xl">{integration.name}</Heading>
                            <Badge colorScheme={getStatusColor(integration.status)} fontSize="md" px={3} py={1}>
                              <HStack spacing={1}>
                                <Icon as={getStatusIcon(integration.status)} />
                                <Text>{getStatusLabel(integration.status)}</Text>
                              </HStack>
                            </Badge>
                            {integration.isActive && (
                              <Badge colorScheme="green">Ativa</Badge>
                            )}
                          </HStack>
                          <HStack>
                            <Button
                              leftIcon={<FiRefreshCw />}
                              size="sm"
                              onClick={fetchIntegrations}
                              isLoading={loading}
                            >
                              Atualizar
                            </Button>
                            <Button
                              colorScheme="blue"
                              size="sm"
                              onClick={() => testConnection(integration.id)}
                              isLoading={testing === integration.id}
                            >
                              Testar
                            </Button>
                          </HStack>
                        </HStack>

                        <Text color="gray.600" mb={2}>
                          {integration.description}
                        </Text>

                        {integration.errorMessage && (
                          <Alert status="error" mt={4} borderRadius="md">
                            <AlertIcon />
                            <Box>
                              <AlertTitle>Erro na integração</AlertTitle>
                              <AlertDescription>{integration.errorMessage}</AlertDescription>
                            </Box>
                          </Alert>
                        )}

                        {integration.lastSync && (
                          <Text fontSize="sm" color="gray.500" mt={2}>
                            Última sincronização: {formatDateTime(integration.lastSync)}
                          </Text>
                        )}
                      </Box>
                    ))
                  )}
                </VStack>
              )}
            </TabPanel>

            {/* TAB: LOGS */}
            <TabPanel>
              <Box p={6}>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Logs de Integrações</Heading>
                  <Button
                    leftIcon={<FiRefreshCw />}
                    size="sm"
                    onClick={fetchLogs}
                    isLoading={loadingLogs}
                  >
                    Atualizar
                  </Button>
                </HStack>

                {loadingLogs ? (
                  <Box textAlign="center" py={10}>
                    <Spinner size="xl" />
                  </Box>
                ) : logs.length === 0 ? (
                  <Box textAlign="center" py={10}>
                    <Text color="gray.500">Nenhum log encontrado</Text>
                  </Box>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Data</Th>
                          <Th>Plataforma</Th>
                          <Th>Tipo</Th>
                          <Th>Severidade</Th>
                          <Th>Mensagem</Th>
                          <Th>Status</Th>
                          <Th>Tempo</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {logs.map((log) => (
                          <Tr key={log.id}>
                            <Td>{formatDateTime(log.timestamp)}</Td>
                            <Td>
                              <Badge>{log.platform}</Badge>
                            </Td>
                            <Td>
                              <Badge>{log.type}</Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={getSeverityColor(log.severity)}>
                                {log.severity}
                              </Badge>
                            </Td>
                            <Td fontSize="sm">{log.message}</Td>
                            <Td>{log.statusCode || '-'}</Td>
                            <Td>{log.responseTime ? `${log.responseTime}ms` : '-'}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async () => ({}));

