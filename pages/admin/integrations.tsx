import { useEffect, useMemo, useState } from 'react';
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
} from '@chakra-ui/react';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';

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

function IntegrationsPage({ tCommon, tPage, translations }: AdminPageProps) {
  const [cartrackStatus, setCartrackStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const toast = useToast();

  const t = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const tAdmin = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const fetchCartrackStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/integrations/cartrack/status');
      if (response.ok) {
        const data = await response.json();
        setCartrackStatus(data);
      }
    } catch (error) {
      console.error('Erro ao buscar status do Cartrack:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCartrackConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/admin/integrations/cartrack/test');
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Conexão bem-sucedida!',
          description: 'A integração com o Cartrack está funcionando corretamente.',
          status: 'success',
          duration: 5000,
        });
        fetchCartrackStatus();
      } else {
        toast({
          title: 'Erro na conexão',
          description: result.error || 'Não foi possível conectar ao Cartrack.',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao testar conexão',
        description: 'Ocorreu um erro ao tentar conectar ao Cartrack.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchCartrackStatus();
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

  return (
    <AdminLayout
      title={tAdmin('integrations.title', 'Integrações')}
      subtitle={tAdmin('integrations.subtitle', 'Gerencie suas integrações com serviços externos')}
      breadcrumbs={[{ label: tAdmin('integrations.breadcrumb', 'Integrações') }]}
      translations={translations}
    >
      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="green.500" />
        </Box>
      ) : (
        <VStack spacing={6} align="stretch">
          {/* Cartrack Integration */}
          <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
            <HStack justify="space-between" mb={4}>
              <HStack>
                <Heading fontSize="2xl">Cartrack</Heading>
                {cartrackStatus && (
                  <Badge colorScheme={getStatusColor(cartrackStatus.status)} fontSize="md" px={3} py={1}>
                    <HStack spacing={1}>
                      <Icon as={getStatusIcon(cartrackStatus.status)} />
                      <Text>{getStatusLabel(cartrackStatus.status)}</Text>
                    </HStack>
                  </Badge>
                )}
              </HStack>
              <HStack>
                <Button
                  leftIcon={<FiRefreshCw />}
                  size="sm"
                  onClick={fetchCartrackStatus}
                  isLoading={loading}
                >
                  Atualizar
                </Button>
                <Button
                  colorScheme="blue"
                  size="sm"
                  onClick={testCartrackConnection}
                  isLoading={testing}
                >
                  Testar Conexão
                </Button>
              </HStack>
            </HStack>

            <Text mt={2} color="gray.600">
              Integração com a API da Cartrack para monitoramento de frota em tempo real.
            </Text>

            {cartrackStatus?.errorMessage && (
              <Alert status="error" mt={4} borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Erro na integração</AlertTitle>
                  <AlertDescription>{cartrackStatus.errorMessage}</AlertDescription>
                </Box>
              </Alert>
            )}

            {cartrackStatus?.status === 'connected' && cartrackStatus.stats && (
              <>
                <Divider my={4} />
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Stat>
                    <StatLabel>Total de Viagens</StatLabel>
                    <StatNumber>{cartrackStatus.stats.totalTrips || 0}</StatNumber>
                    <StatHelpText>Últimos 7 dias</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Veículos Ativos</StatLabel>
                    <StatNumber>{cartrackStatus.stats.totalVehicles || 0}</StatNumber>
                    <StatHelpText>Com dados recentes</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Distância Total</StatLabel>
                    <StatNumber>
                      {cartrackStatus.stats.totalDistance 
                        ? `${(cartrackStatus.stats.totalDistance / 1000).toFixed(1)} km`
                        : '0 km'}
                    </StatNumber>
                    <StatHelpText>Últimos 7 dias</StatHelpText>
                  </Stat>
                </SimpleGrid>
              </>
            )}

            {cartrackStatus?.lastSync && (
              <Text fontSize="sm" color="gray.500" mt={4}>
                Última sincronização: {new Date(cartrackStatus.lastSync).toLocaleString('pt-PT')}
              </Text>
            )}
          </Box>

          {/* Bolt Integration */}
          <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
            <HStack justify="space-between" mb={4}>
              <HStack>
                <Heading fontSize="2xl">Bolt</Heading>
                <Badge colorScheme="gray" fontSize="md" px={3} py={1}>
                  <HStack spacing={1}>
                    <Icon as={FiAlertTriangle} />
                    <Text>Indisponível</Text>
                  </HStack>
                </Badge>
              </HStack>
            </HStack>

            <Text mt={2} color="gray.600">
              Atualmente, não há uma API pública da Bolt para integração direta de dados de frota.
            </Text>

            <Alert status="info" mt={4} borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>API não disponível</AlertTitle>
                <AlertDescription>
                  A Bolt não oferece uma API pública para dados de frota de veículos de transporte de passageiros no momento.
                </AlertDescription>
              </Box>
            </Alert>
          </Box>
        </VStack>
      )}
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async () => {
  return {};
});

export default IntegrationsPage;
