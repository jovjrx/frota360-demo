import { useState, useMemo, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import {
  Box,
  Card,
  CardBody,
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
import { FiRefreshCw, FiList, FiNavigation, FiAlertTriangle, FiMap } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { fetchCartrackMonitorData, type CartrackMonitorData } from '@/lib/integrations/cartrack/monitor';

// Importação dinâmica do mapa (só carrega no cliente)
const MapView = dynamic(() => import('@/components/admin/CartrackMap'), {
  ssr: false,
  loading: () => (
    <Center h="600px">
      <Spinner size="xl" color="green.500" />
    </Center>
  ),
});

type CartrackTrip = CartrackMonitorData['trips'][number];

interface MonitorPageProps extends AdminPageProps {
  initialData: CartrackMonitorData | null;
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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [manualLoading, setManualLoading] = useState(false);
  const toast = useToast();

  const tMonitor = useMemo(() => {
    const base = createSafeTranslator(tPage);
    return (key: string, variables?: Record<string, any>) =>
      base(key, MONITOR_FALLBACKS[key] ?? key, variables);
  }, [tPage]);
  const fetcher = useCallback(async () => {
    const response = await fetch('/api/admin/integrations/cartrack/data');
    let payload: any = {};

    try {
      payload = await response.json();
    } catch (parseError) {
      payload = {};
    }

    if (!response.ok) {
      const message = payload?.error ?? tMonitor('error_fetching_cartrack_data');
      throw new Error(message);
    }

    return (payload?.data ?? null) as CartrackMonitorData | null;
  }, [tMonitor]);

  const { data, error, isValidating, mutate } = useSWR<CartrackMonitorData | null>(
    '/api/admin/integrations/cartrack/data',
    fetcher,
    {
      fallbackData: initialData ?? undefined,
      revalidateOnFocus: false,
      refreshInterval: autoRefresh ? 30000 : 0,
    }
  );

  useEffect(() => {
    if (!error) {
      return;
    }

    toast({
      title: tMonitor('error_updating_title'),
      description: error instanceof Error ? error.message : tMonitor('error_fetching_cartrack_data_generic'),
      status: 'error',
      duration: 5000,
    });
  }, [error, toast, tMonitor]);

  const handleManualRefresh = useCallback(async () => {
    setManualLoading(true);
    try {
      const updated = await mutate();
      if (updated) {
        toast({
          title: tMonitor('data_updated_title'),
          description: tMonitor('trips_loaded_description', { count: updated.count }),
          status: 'success',
          duration: 3000,
        });
      }
    } catch (refreshError) {
      const message = refreshError instanceof Error
        ? refreshError.message
        : tMonitor('error_fetching_cartrack_data_generic');
      toast({
        title: tMonitor('error_updating_title'),
        description: message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setManualLoading(false);
    }
  }, [mutate, tMonitor, toast]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((prev) => {
      const next = !prev;
      if (next) {
        void mutate();
      }
      return next;
    });
  }, [mutate]);

  const stats = useMemo(() => {
    if (!data) {
      return null;
    }

    const totalTrips = data.count;
    const totalDistanceKm = data.summary.totalDistance / 1000;
    const totalEvents = data.trips.reduce(
      (sum, trip) =>
        sum +
        trip.harsh_braking_events +
        trip.harsh_cornering_events +
        trip.harsh_acceleration_events +
        trip.road_speeding_events,
      0
    );
    const activeVehicles = new Set(data.trips.map((trip) => trip.vehicle_id)).size;
    const totalDuration = data.trips.reduce((sum, trip) => sum + trip.trip_duration_seconds, 0);
    const avgSpeed = data.trips.length > 0
      ? data.trips.reduce((sum, trip) => sum + trip.max_speed, 0) / data.trips.length
      : 0;

    return {
      totalTrips,
      totalDistance: totalDistanceKm.toFixed(2),
      avgSpeed: avgSpeed.toFixed(1),
      totalEvents,
      activeVehicles,
      totalDuration,
    };
  }, [data]);

  const isInitialLoading = !data && isValidating;
  const trips = data?.trips ?? [];

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
            onClick={toggleAutoRefresh}
          >
            {autoRefresh ? tMonitor("disable_auto_refresh") : tMonitor("enable_auto_refresh")}
          </Button>
          <Button
            leftIcon={<FiRefreshCw />}
            colorScheme="green"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={manualLoading}
            isDisabled={manualLoading || isValidating}
          >
            {tMonitor("update_now_button")}
          </Button>
        </HStack>
      </HStack>

      {/* KPIs */}
      {isInitialLoading ? (
        <Center py={12}>
          <Spinner size="lg" color="green.500" />
        </Center>
      ) : stats && (
        <SimpleGrid columns={{ base: 2, md: 6 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">{tMonitor("total_trips")} ({tMonitor("last_week")})</StatLabel>
                <StatNumber fontSize="2xl">{stats.totalTrips}</StatNumber>
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

      <Tabs colorScheme="green" variant="solid-rounded">
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
           <TabPanel px={0}>
            <Card>
              <CardBody>
                {isInitialLoading ? (
                  <Center py={12}>
                    <Spinner size="lg" color="green.500" />
                  </Center>
                ) : (
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
                        {trips.map((trip) => {
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
                                <Text>
                                  {trip.driver_name} {trip.driver_surname}
                                </Text>
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

                    {trips.length === 0 && (
                      <Center py={12}>
                        <VStack>
                          <Icon as={FiNavigation} boxSize={12} color="gray.400" />
                          <Text color="gray.500">{tMonitor("no_trips_recorded")}</Text>
                        </VStack>
                      </Center>
                    )}
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Tab 2: Mapa */}
          <TabPanel px={0}>
                 <Card>
              <CardBody>
            {isInitialLoading ? (
              <Center h="600px">
                <Spinner size="lg" color="green.500" />
              </Center>
            ) : trips.length > 0 ? (
              <Box h="600px">
                <MapView trips={trips} />
              </Box>
            ) : (
              <Center h="600px">
                <VStack>
                  <Icon as={FiMap} boxSize={12} color="gray.400" />
                  <Text color="gray.500">{tMonitor("no_data_for_map")}</Text>
                </VStack>
              </Center>
            )}
            </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>


    </AdminLayout>
  );
}

// SSR com autenticação e traduções
export const getServerSideProps = withAdminSSR(async () => {
  try {
    const initialData = await fetchCartrackMonitorData();
    return {
      initialData,
    };
  } catch (error) {
    console.error('[Cartrack Monitor] Falha ao buscar dados iniciais:', error);
    return {
      initialData: null,
    };
  }
});

