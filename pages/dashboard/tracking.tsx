import { useEffect, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import {
  FiMapPin,
  FiTruck,
  FiClock,
  FiActivity,
  FiAlertCircle,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import PainelLayout from '@/components/layouts/DashboardLayout';
import dynamic from 'next/dynamic';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import { getTranslation } from '@/lib/translations';

// Importar o componente do mapa dinamicamente para evitar problemas de SSR
const DriverCartrackMap = dynamic(() => import('@/components/admin/DriverCartrackMap'), { ssr: false });

interface Motorista {
  id: string;
  type: 'affiliate' | 'renter';
  vehicle: {
    plate: string;
    model: string;
  } | null;
}

interface CartrackData {
  latestPosition: {
    latitude: number;
    longitude: number;
    timestamp: string;
    speed: number;
  } | null;
  trips: Array<{
    id: string;
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
    distance: number;
    duration: number;
    startTime: string;
    endTime: string;
  }>;
  vehicle: {
    plate: string;
    model: string;
  };
}

interface PainelRastreamentoProps extends DashboardPageProps {
  motorista: any;
}

export default function PainelRastreamento({ motorista, translations, locale }: PainelRastreamentoProps) {
  const router = useRouter();
  const toast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [cartrackData, setCartrackData] = useState<CartrackData | null>(null);

  const t = (key: string, fallback?: string) => {
    if (!translations?.common) return fallback || key;
    return getTranslation(translations.common, key) || fallback || key;
  };

  const tDashboard = (key: string, fallback?: string) => {
    if (!translations?.dashboard) return fallback || key;
    return getTranslation(translations.dashboard, key) || fallback || key;
  };

  useEffect(() => {
    carregarDados();
  }, [motorista?.id]);

  async function carregarDados() {
    try {
      setLoading(true);

      if (motorista?.type === 'renter' && motorista?.vehicle?.plate) {
        const cartrackRes = await fetch(`/api/painel/cartrack?driverId=${motorista.id}`);
        if (!cartrackRes.ok) {
          const error = await cartrackRes.json();
          throw new Error(error.message || 'Erro ao carregar dados do Cartrack');
        }
        const dadosCartrack = await cartrackRes.json();
        setCartrackData(dadosCartrack);
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: t('error', 'Erro'),
        description: error.message || t('error.loading', 'Erro ao carregar dados'),
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  const calculateDailyMileage = (trips: CartrackData['trips']) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return trips.reduce((total, trip) => {
      const tripDate = new Date(trip.startTime);
      tripDate.setHours(0, 0, 0, 0);
      if (tripDate.getTime() === today.getTime()) {
        return total + trip.distance;
      }
      return total;
    }, 0);
  };

  const calculateDailyDrivingTime = (trips: CartrackData['trips']) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDurationMs = trips.reduce((total, trip) => {
      const tripDate = new Date(trip.startTime);
      tripDate.setHours(0, 0, 0, 0);
      if (tripDate.getTime() === today.getTime()) {
        return total + trip.duration;
      }
      return total;
    }, 0);
    const hours = Math.floor(totalDurationMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  if (loading) {
    return (
      <PainelLayout 
        title={tDashboard('tracking.title', 'Rastreamento')}
        breadcrumbs={[{ label: tDashboard('tracking.breadcrumb', 'Rastreamento') }]}
        translations={translations}
      >
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="green.500" />
          <Text mt={4} color="gray.600">{t('loading', 'Carregando...')}</Text>
        </Box>
      </PainelLayout>
    );
  }

  if (!motorista) {
    return (
      <PainelLayout 
        title={tDashboard('tracking.title', 'Rastreamento')}
        breadcrumbs={[{ label: tDashboard('tracking.breadcrumb', 'Rastreamento') }]}
        translations={translations}
      >
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>{t('error', 'Erro ao carregar dados')}</AlertTitle>
          <AlertDescription>
            {t('error.try_again', 'Não foi possível carregar seus dados. Tente novamente.')}
          </AlertDescription>
        </Alert>
      </PainelLayout>
    );
  }

  // Se for afiliado, não tem acesso ao rastreamento
  if (motorista.type === 'affiliate') {
    return (
      <PainelLayout 
        title={tDashboard('tracking.title', 'Rastreamento')}
        subtitle={tDashboard('tracking.subtitle', 'Dados de quilometragem e localização')}
        breadcrumbs={[{ label: tDashboard('tracking.breadcrumb', 'Rastreamento') }]}
        translations={translations}
      >
        <Alert 
          status="info" 
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="300px"
          borderRadius="lg"
        >
          <Icon as={FiAlertCircle} boxSize={12} mb={4} color="blue.500" />
          <AlertTitle fontSize="xl" mb={2}>
            Rastreamento Disponível Apenas para Locatários
          </AlertTitle>
          <AlertDescription maxW="md" fontSize="md">
            Esta funcionalidade está disponível apenas para motoristas <strong>locatários</strong> que utilizam veículos da frota com sistema Cartrack instalado.
            <br /><br />
            Como <strong>afiliado com veículo próprio</strong>, você não tem acesso ao rastreamento.
            <br /><br />
            Para informações sobre suas viagens, consulte os aplicativos <strong>Uber</strong> e <strong>Bolt</strong>.
          </AlertDescription>
        </Alert>
      </PainelLayout>
    );
  }

  // Se for locatário mas não tem veículo atribuído
  if (!motorista.vehicle || !motorista.vehicle.plate) {
    return (
      <PainelLayout 
        title={tDashboard('tracking.title', 'Rastreamento')}
        subtitle={tDashboard('tracking.subtitle', 'Dados de quilometragem e localização')}
        breadcrumbs={[{ label: tDashboard('tracking.breadcrumb', 'Rastreamento') }]}
        translations={translations}
      >
        <Alert 
          status="warning"
          variant="left-accent"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          py={8}
          borderRadius="lg"
        >
          <Icon as={FiTruck} boxSize={12} mb={4} color="orange.500" />
          <AlertTitle fontSize="xl" mb={2}>
            Veículo Não Atribuído
          </AlertTitle>
          <AlertDescription maxW="md" fontSize="md">
            Você está cadastrado como <strong>locatário</strong>, mas ainda não tem um veículo atribuído.
            <br /><br />
            Entre em contato com o administrador para solicitar a atribuição de um veículo da frota.
            <br /><br />
            Após a atribuição, você poderá acompanhar a quilometragem e localização do veículo por esta página.
          </AlertDescription>
        </Alert>
      </PainelLayout>
    );
  }

  // Se for locatário com veículo
  const dailyMileage = cartrackData ? calculateDailyMileage(cartrackData.trips) : 0;
  const dailyDrivingTime = cartrackData ? calculateDailyDrivingTime(cartrackData.trips) : '0h 0min';

  return (
    <PainelLayout 
      title={tDashboard('tracking.title', 'Rastreamento')}
      subtitle={tDashboard('tracking.subtitle', 'Dados de quilometragem e localização do seu veículo')}
      breadcrumbs={[{ label: tDashboard('tracking.breadcrumb', 'Rastreamento') }]}
      translations={translations}
    >
      {/* Informações do Veículo */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
        <HStack mb={4}>
          <Icon as={FiTruck} boxSize={5} color="green.500" />
          <Text fontSize="lg" fontWeight="bold">{tDashboard('tracking.vehicle', 'Veículo')}</Text>
        </HStack>
        
        <HStack spacing={8}>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>{tDashboard('tracking.plate', 'Matrícula')}</Text>
            <Text fontSize="xl" fontWeight="bold" fontFamily="mono">
              {motorista.vehicle.plate}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>{tDashboard('tracking.model', 'Modelo')}</Text>
            <Text fontSize="xl" fontWeight="bold">
              {motorista.vehicle.model}
            </Text>
          </Box>
        </HStack>
      </Box>

      {/* Estatísticas do Dia */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
          <Stat>
            <StatLabel color="gray.600">
              <HStack>
                <Icon as={FiActivity} />
                <Text>Quilometragem Hoje</Text>
              </HStack>
            </StatLabel>
            <StatNumber>{dailyMileage.toFixed(2)} km</StatNumber>
            <StatHelpText>Últimas 24h</StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
          <Stat>
            <StatLabel color="gray.600">
              <HStack>
                <Icon as={FiClock} />
                <Text>Tempo em Movimento</Text>
              </HStack>
            </StatLabel>
            <StatNumber>{dailyDrivingTime}</StatNumber>
            <StatHelpText>Últimas 24h</StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
          <Stat>
            <StatLabel color="gray.600">
              <HStack>
                <Icon as={FiMapPin} />
                <Text>Última Localização</Text>
              </HStack>
            </StatLabel>
            <StatNumber>
              {cartrackData?.latestPosition ? 
                `${cartrackData.latestPosition.latitude.toFixed(4)}, ${cartrackData.latestPosition.longitude.toFixed(4)}` : 
                'N/A'
              }
            </StatNumber>
            <StatHelpText>
              {cartrackData?.latestPosition ? 
                `Velocidade: ${cartrackData.latestPosition.speed} km/h` : 
                'Sem dados'
              }
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Mapa do Veículo */}
      {cartrackData?.latestPosition && (
        <Box bg="white" p={0} borderRadius="lg" shadow="sm" borderWidth="1px" height="500px">
          <DriverCartrackMap 
            initialPosition={{
              lat: cartrackData.latestPosition.latitude,
              lng: cartrackData.latestPosition.longitude,
            }}
            trips={cartrackData.trips.map(trip => ({
              start: { lat: trip.startLatitude, lng: trip.startLongitude },
              end: { lat: trip.endLatitude, lng: trip.endLongitude },
              path: [], // Cartrack API doesn't provide full path, only start/end
            }))}
          />
        </Box>
      )}

      {/* Estatísticas da Semana (mockup) - Manter por enquanto, pois a API de trips só retorna 24h */}
      <Box bg="gray.100" p={6} borderRadius="lg" borderWidth="1px" borderColor="gray.300">
        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.600">
          {tDashboard('tracking.weekly_stats', 'Estatísticas da Semana Atual')}
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>{tDashboard('tracking.total_km', 'Quilometragem Total')}</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.400">--- km</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>{tDashboard('tracking.days_worked', 'Dias Trabalhados')}</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.400">-</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>{tDashboard('tracking.daily_avg', 'Média Diária')}</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.400">--- km</Text>
          </Box>
        </SimpleGrid>
      </Box>
    </PainelLayout>
  );
}

export const getServerSideProps = withDashboardSSR(
  { loadDriverData: true },
  async (context, user, driverId) => {
    return {};
  }
);

