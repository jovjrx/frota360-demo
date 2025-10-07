import { useState, useEffect, useRef } from 'react';
import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
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
  Badge,
  Button,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Center,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiMap,
  FiList,
  FiNavigation,
  FiAlertTriangle,
  FiClock,
  FiTrendingUp,
} from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { PageProps } from '@/interface/Global';
import { loadTranslations, getTranslation } from '@/lib/translations';

// Importação dinâmica do mapa (só carrega no cliente)
const MapView = dynamic(() => import('@/components/admin/CartrackMap'), {
  ssr: false,
  loading: () => (
    <Center h="600px">
      <Spinner size="xl" color="green.500" />
    </Center>
  ),
});

interface CartracTrip {
  trip_id: number;
  vehicle_id: number;
  registration: string;
  driver_name: string;
  driver_surname: string;
  start_timestamp: string;
  end_timestamp: string;
  trip_duration: string;
  trip_duration_seconds: number;
  start_location: string;
  end_location: string;
  trip_distance: number;
  max_speed: number;
  harsh_braking_events: number;
  harsh_cornering_events: number;
  harsh_acceleration_events: number;
  road_speeding_events: number;
  start_coordinates: {
    latitude: number;
    longitude: number;
  };
  end_coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface CartrackData {
  platform: string;
  lastUpdate: string;
  count: number;
  summary: {
    totalTrips: number;
    totalVehicles: number;
    totalDistance: number;
    period: {
      start: string;
      end: string;
    };
  };
  trips: CartracTrip[];
}

interface CartrackPageProps extends PageProps {
  initialData: CartrackData | null;
  translations: {
    common: any;
    page: any;
  };
  locale: string;
}

export default function CartrackPage({ initialData, translations, locale, tCommon, tPage }: CartrackPageProps) {
  const [data, setData] = useState<CartrackData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const toast = useToast();

  // Função para buscar dados da API
  const fetchCartrackData = async (showToast = false) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/integrations/cartrack/data');

      if (!response.ok) {
        throw new Error('Erro ao buscar dados da Cartrack');
      }

      const result = await response.json();

      // Ordenar viagens por data mais recente
      if (result.data?.trips) {
        result.data.trips.sort((a: CartracTrip, b: CartracTrip) => {
          const dateA = new Date(a.start_timestamp).getTime();
          const dateB = new Date(b.start_timestamp).getTime();
          return dateB - dateA; // Mais recente primeiro
        });
      }

      setData(result.data);

      if (showToast) {
        toast({
          title: 'Dados atualizados',
          description: `${result.data.count} viagens carregadas`,
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível buscar os dados da Cartrack',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchCartrackData(false);
      }, 30000); // 30 segundos

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh]);

  // Calcular estatísticas
  const stats = data ? {
    totalTrips: data.count,
    totalDistance: (data.summary.totalDistance / 1000).toFixed(2), // Converter para km
    avgSpeed: data.trips.length > 0
      ? (data.trips.reduce((sum, t) => sum + t.max_speed, 0) / data.trips.length).toFixed(1)
      : '0',
    totalEvents: data.trips.reduce((sum, t) =>
      sum + t.harsh_braking_events + t.harsh_cornering_events +
      t.harsh_acceleration_events + t.road_speeding_events, 0
    ),
    activeVehicles: new Set(data.trips.map(t => t.vehicle_id)).size,
    totalDuration: data.trips.reduce((sum, t) => sum + t.trip_duration_seconds, 0),
  } : null;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const getEventsBadgeColor = (events: number) => {
    if (events === 0) return 'green';
    if (events <= 3) return 'yellow';
    return 'red';
  };

  return (
    <AdminLayout
      title="Monitor - Rastreamento"
      subtitle="Rastreamento e monitoramento de viagens em tempo real"
      breadcrumbs={[{ label: 'Monitor' }]}
    >

      <HStack justify="space-between">
        <HStack>
          <Badge colorScheme={autoRefresh ? 'green' : 'gray'} fontSize="sm">
            {autoRefresh ? '🟢 Auto-refresh (30s)' : '⚪ Manual'}
          </Badge>
          {data && (
            <Text fontSize="sm" color="gray.600">
              Última atualização: {new Date(data.lastUpdate).toLocaleString('pt-PT')}
            </Text>
          )}
        </HStack>

        <HStack>
          <Button
            size="sm"
            variant={autoRefresh ? 'solid' : 'outline'}
            colorScheme="green"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Desativar Auto-refresh' : 'Ativar Auto-refresh'}
          </Button>
          <Button
            leftIcon={<FiRefreshCw />}
            colorScheme="green"
            size="sm"
            onClick={() => fetchCartrackData(true)}
            isLoading={loading}
          >
            Atualizar Agora
          </Button>
        </HStack>
      </HStack>

      {/* KPIs */}
      {stats && (
        <SimpleGrid columns={{ base: 2, md: 6 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Total de Viagens</StatLabel>
                <StatNumber fontSize="2xl">{stats.totalTrips}</StatNumber>
                <StatHelpText>Última semana</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Veículos Ativos</StatLabel>
                <StatNumber fontSize="2xl">{stats.activeVehicles}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Distância Total</StatLabel>
                <StatNumber fontSize="xl">{stats.totalDistance} km</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Velocidade Média</StatLabel>
                <StatNumber fontSize="xl">{stats.avgSpeed} km/h</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Tempo Total</StatLabel>
                <StatNumber fontSize="lg">{formatDuration(stats.totalDuration)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Eventos</StatLabel>
                <StatNumber fontSize="2xl" color={stats.totalEvents > 50 ? 'red.500' : 'green.500'}>
                  {stats.totalEvents}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Tabs: Lista e Mapa */}
      <Card>
        <Tabs colorScheme="green" variant="enclosed">
          <TabList>
            <Tab>
              <Icon as={FiList} mr={2} />
              Lista de Viagens
            </Tab>
            <Tab>
              <Icon as={FiMap} mr={2} />
              Mapa
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Lista de Viagens */}
            <TabPanel p={0}>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Veículo</Th>
                      <Th>Motorista</Th>
                      <Th>Início</Th>
                      <Th>Fim</Th>
                      <Th isNumeric>Distância</Th>
                      <Th isNumeric>Duração</Th>
                      <Th isNumeric>Vel. Máx</Th>
                      <Th>Eventos</Th>
                      <Th>Horário</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data?.trips.map((trip) => {
                      const totalEvents =
                        trip.harsh_braking_events +
                        trip.harsh_cornering_events +
                        trip.harsh_acceleration_events +
                        trip.road_speeding_events;

                      return (
                        <Tr key={trip.trip_id}>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{trip.registration}</Text>
                              <Text fontSize="xs" color="gray.500">
                                ID: {trip.vehicle_id}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Text>{trip.driver_name} {trip.driver_surname}</Text>
                          </Td>
                          <Td>
                            <Tooltip label={trip.start_location}>
                              <Text fontSize="sm" noOfLines={2} maxW="200px">
                                {trip.start_location}
                              </Text>
                            </Tooltip>
                          </Td>
                          <Td>
                            <Tooltip label={trip.end_location}>
                              <Text fontSize="sm" noOfLines={2} maxW="200px">
                                {trip.end_location}
                              </Text>
                            </Tooltip>
                          </Td>
                          <Td isNumeric>
                            <Text>{formatDistance(trip.trip_distance)}</Text>
                          </Td>
                          <Td isNumeric>
                            <Text>{trip.trip_duration}</Text>
                          </Td>
                          <Td isNumeric>
                            <Text fontWeight="medium">{trip.max_speed} km/h</Text>
                          </Td>
                          <Td>
                            <HStack>
                              <Badge colorScheme={getEventsBadgeColor(totalEvents)}>
                                {totalEvents}
                              </Badge>
                              {totalEvents > 0 && (
                                <Tooltip
                                  label={`
                                      Freadas: ${trip.harsh_braking_events}
                                      Curvas: ${trip.harsh_cornering_events}
                                      Acelerações: ${trip.harsh_acceleration_events}
                                      Excesso: ${trip.road_speeding_events}
                                    `}
                                >
                                  <span>
                                    <Icon as={FiAlertTriangle} color="orange.500" />
                                  </span>
                                </Tooltip>
                              )}
                            </HStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm">
                                {new Date(trip.start_timestamp).toLocaleDateString('pt-PT')}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {new Date(trip.start_timestamp).toLocaleTimeString('pt-PT', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Text>
                            </VStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>

                {(!data || data.trips.length === 0) && (
                  <Center py={12}>
                    <VStack>
                      <Icon as={FiNavigation} boxSize={12} color="gray.400" />
                      <Text color="gray.500">Nenhuma viagem registrada</Text>
                    </VStack>
                  </Center>
                )}
              </Box>
            </TabPanel>

            {/* Tab 2: Mapa */}
            <TabPanel>
              {data && data.trips.length > 0 ? (
                <Box h="600px">
                  <MapView trips={data.trips} />
                </Box>
              ) : (
                <Center h="600px">
                  <VStack>
                    <Icon as={FiMap} boxSize={12} color="gray.400" />
                    <Text color="gray.500">Nenhum dado disponível para exibir no mapa</Text>
                  </VStack>
                </Center>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>

    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);

  if ('redirect' in authResult || 'notFound' in authResult) {
    return authResult;
  }

  // Buscar dados iniciais da Cartrack
  let initialData: CartrackData | null = null;

  try {
    // TODO: Implementar busca real da API
    // Por enquanto retorna null, os dados serão carregados no cliente
    initialData = null;
  } catch (error) {
    console.error('Erro ao buscar dados da Cartrack:', error);
  }

  return {
    props: {
      ...authResult.props,
      initialData,
    },
  };
};
