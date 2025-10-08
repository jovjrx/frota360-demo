import { useState, useEffect, useRef, useMemo } from 'react';
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
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';

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

interface MonitorPageProps extends AdminPageProps {
  initialData: CartrackData | null;
}

const MONITOR_FALLBACKS: Record<string, string> = {
  error_fetching_cartrack_data: 'Falha ao buscar dados do Cartrack.',
  error_fetching_cartrack_data_generic: 'Ocorreu um erro ao buscar dados do Cartrack.',
  data_updated_title: 'Dados atualizados',
  trips_loaded_description: '{{count}} viagens carregadas com sucesso.',
  error_updating_title: 'Erro ao atualizar dados',
  monitor_title: 'Monitoramento Cartrack',
  monitor_subtitle: 'Acompanhe viagens, eventos e desempenho em tempo real',
  auto_refresh_on: 'Atualização automática ligada',
  auto_refresh_off: 'Atualização automática desligada',
  last_update: 'Última atualização',
  disable_auto_refresh: 'Desligar auto-atualização',
  enable_auto_refresh: 'Ligar auto-atualização',
  update_now_button: 'Atualizar agora',
  total_trips: 'Total de viagens',
  last_week: 'Últimos 7 dias',
  active_vehicles: 'Veículos ativos',
  total_distance: 'Distância total',
  average_speed: 'Velocidade média',
  total_time: 'Tempo total',
  events: 'Eventos',
  trip_list_tab: 'Lista de viagens',
  map_tab: 'Mapa',
  vehicle_column: 'Veículo',
  driver_column: 'Motorista',
  start_column: 'Início',
  end_column: 'Fim',
  distance_column: 'Distância',
  duration_column: 'Duração',
  max_speed_column: 'Velocidade máx.',
  events_column: 'Eventos',
  time_column: 'Horário',
  id_label: 'ID',
  events_tooltip: 'Travagens fortes: {{braking}} | Curvas bruscas: {{cornering}} | Acelerações bruscas: {{acceleration}} | Excesso de velocidade: {{speeding}}',
  no_trips_recorded: 'Nenhuma viagem registada neste período.',
  no_data_for_map: 'Sem dados suficientes para exibir o mapa.',
};

export default function MonitorPage({ locale, initialData, tPage }: MonitorPageProps) {
  const [data, setData] = useState<CartrackData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const toast = useToast();

  const tMonitor = useMemo(() => {
    const base = createSafeTranslator(tPage);
    return (key: string, variables?: Record<string, any>) =>
      base(key, MONITOR_FALLBACKS[key] ?? key, variables);
  }, [tPage]);

  // Função para buscar dados da API
  const fetchCartrackData = async (showToast = false) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/integrations/cartrack/data");

      if (!response.ok) {
        throw new Error(tMonitor("error_fetching_cartrack_data"));
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
          title: tMonitor("data_updated_title"),
          description: tMonitor("trips_loaded_description", { count: result.data.count }),
          status: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: tMonitor("error_updating_title"),
        description: error instanceof Error ? error.message : tMonitor("error_fetching_cartrack_data_generic"),
        status: "error",
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
      title={tMonitor("monitor_title")}
      subtitle={tMonitor("monitor_subtitle")}
      breadcrumbs={[{ label: tMonitor("monitor_title") }]}
    >

      <HStack justify="space-between">
        <HStack>
          <Badge colorScheme={autoRefresh ? "green" : "gray"} fontSize="sm">
            {autoRefresh ? tMonitor("auto_refresh_on") : tMonitor("auto_refresh_off")}
          </Badge>
          {data && (
            <Text fontSize="sm" color="gray.600">
              {tMonitor("last_update")}: {new Date(data.lastUpdate).toLocaleString(locale)}
            </Text>
          )}
        </HStack>

        <HStack>
          <Button
            size="sm"
            variant={autoRefresh ? "solid" : "outline"}
            colorScheme="green"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? tMonitor("disable_auto_refresh") : tMonitor("enable_auto_refresh")}
          </Button>
          <Button
            leftIcon={<FiRefreshCw />}
            colorScheme="green"
            size="sm"
            onClick={() => fetchCartrackData(true)}
            isLoading={loading}
          >
            {tMonitor("update_now_button")}
          </Button>
        </HStack>
      </HStack>

      {/* KPIs */}
      {stats && (
        <SimpleGrid columns={{ base: 2, md: 6 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tMonitor("total_trips")}</StatLabel>
                <StatNumber fontSize="2xl">{stats.totalTrips}</StatNumber>
                <StatHelpText>{tMonitor("last_week")}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tMonitor("active_vehicles")}</StatLabel>
                <StatNumber fontSize="2xl">{stats.activeVehicles}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tMonitor("total_distance")}</StatLabel>
                <StatNumber fontSize="xl">{stats.totalDistance} km</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tMonitor("average_speed")}</StatLabel>
                <StatNumber fontSize="xl">{stats.avgSpeed} km/h</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tMonitor("total_time")}</StatLabel>
                <StatNumber fontSize="lg">{formatDuration(stats.totalDuration)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tMonitor("events")}</StatLabel>
                <StatNumber fontSize="2xl" color={stats.totalEvents > 50 ? "red.500" : "green.500"}>
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
              {tMonitor("trip_list_tab")}
            </Tab>
            <Tab>
              <Icon as={FiMap} mr={2} />
              {tMonitor("map_tab")}
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Lista de Viagens */}
            <TabPanel p={0}>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>{tMonitor("vehicle_column")}</Th>
                      <Th>{tMonitor("driver_column")}</Th>
                      <Th>{tMonitor("start_column")}</Th>
                      <Th>{tMonitor("end_column")}</Th>
                      <Th isNumeric>{tMonitor("distance_column")}</Th>
                      <Th isNumeric>{tMonitor("duration_column")}</Th>
                      <Th isNumeric>{tMonitor("max_speed_column")}</Th>
                      <Th>{tMonitor("events_column")}</Th>
                      <Th>{tMonitor("time_column")}</Th>
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
                                {tMonitor("id_label")}: {trip.vehicle_id}
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
                                  label={tMonitor("events_tooltip", {
                                    braking: trip.harsh_braking_events,
                                    cornering: trip.harsh_cornering_events,
                                    acceleration: trip.harsh_acceleration_events,
                                    speeding: trip.road_speeding_events,
                                  })}
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
                                {new Date(trip.start_timestamp).toLocaleDateString(locale)}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {new Date(trip.start_timestamp).toLocaleTimeString(locale, {
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
                      <Text color="gray.500">{tMonitor("no_trips_recorded")}</Text>
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
                    <Text color="gray.500">{tMonitor("no_data_for_map")}</Text>
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

// SSR com autenticação e traduções
export const getServerSideProps = withAdminSSR(async (context, user) => {
  // TODO: Adicionar query específica para Cartrack se necessário
  // Por enquanto, os dados serão buscados via SWR no cliente
  return {
    initialData: null,
  };
});

