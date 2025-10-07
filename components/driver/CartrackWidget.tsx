import { Box, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, useColorModeValue, Spinner, Center, Alert, AlertIcon } from '@chakra-ui/react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';

interface CartrackWidgetProps {
  driverId: string;
  translations: Record<string, any>;
}

interface CartrackData {
  vehicle?: {
    plate: string;
    make: string;
    model: string;
    year: number;
    kilometers: number;
    status: string;
  };
  weeklyStats?: {
    totalKilometers: number;
    totalTrips: number;
    averageSpeed: number;
    totalDuration: number;
  };
}

export default function CartrackWidget({ driverId, translations }: CartrackWidgetProps) {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: CartrackData }>(
    `/api/driver/cartrack-data?driverId=${driverId}`,
    fetcher
  );

  const cardBg = useColorModeValue('white', 'gray.700');

  if (error) {
    return (
      <Alert status='error' variant='left-accent'>
        <AlertIcon />
        {translations?.cartrack_error || 'Erro ao carregar dados do Cartrack'}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner size='lg' />
        <Text ml={4}>{translations?.loading || 'Carregando...'}</Text>
      </Center>
    );
  }

  if (!data?.success || !data?.data) {
    return (
      <Alert status='info' variant='left-accent'>
        <AlertIcon />
        {translations?.no_cartrack_data || 'Nenhum dado do Cartrack disponível'}
      </Alert>
    );
  }

  const { vehicle, weeklyStats } = data.data;

  return (
    <Box>
      {vehicle && (
        <Box mb={6}>
          <Heading as="h3" size="md" mb={3}>
            {translations?.vehicle_info || 'Informações do Veículo'}
          </Heading>
          <Box p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" bg={cardBg}>
            <Text fontSize="lg" fontWeight="bold">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </Text>
            <Text color="gray.600">
              {translations?.plate || 'Matrícula'}: {vehicle.plate}
            </Text>
            <Text color="gray.600">
              {translations?.odometer || 'Quilometragem'}: {vehicle.kilometers.toLocaleString()} km
            </Text>
            <Text color="gray.600">
              {translations?.status || 'Status'}: {vehicle.status === 'active' ? 'Ativo' : 'Inativo'}
            </Text>
          </Box>
        </Box>
      )}

      {weeklyStats && (
        <Box>
          <Heading as="h3" size="md" mb={3}>
            {translations?.weekly_stats || 'Estatísticas da Semana'}
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" bg={cardBg}>
              <StatLabel>{translations?.total_kilometers || 'Quilómetros Totais'}</StatLabel>
              <StatNumber>{weeklyStats.totalKilometers.toFixed(1)} km</StatNumber>
              <StatHelpText>{translations?.this_week || 'Esta semana'}</StatHelpText>
            </Stat>

            <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" bg={cardBg}>
              <StatLabel>{translations?.total_trips || 'Total de Viagens'}</StatLabel>
              <StatNumber>{weeklyStats.totalTrips}</StatNumber>
              <StatHelpText>{translations?.this_week || 'Esta semana'}</StatHelpText>
            </Stat>

            <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" bg={cardBg}>
              <StatLabel>{translations?.average_speed || 'Velocidade Média'}</StatLabel>
              <StatNumber>{weeklyStats.averageSpeed.toFixed(1)} km/h</StatNumber>
              <StatHelpText>{translations?.this_week || 'Esta semana'}</StatHelpText>
            </Stat>

            <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" bg={cardBg}>
              <StatLabel>{translations?.total_duration || 'Tempo Total'}</StatLabel>
              <StatNumber>{(weeklyStats.totalDuration / 60).toFixed(1)} h</StatNumber>
              <StatHelpText>{translations?.this_week || 'Esta semana'}</StatHelpText>
            </Stat>
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
}
