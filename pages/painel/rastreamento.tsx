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
import PainelLayout from '@/components/layouts/PainelLayout';

interface Motorista {
  id: string;
  type: 'affiliate' | 'renter';
  vehicle: {
    plate: string;
    model: string;
  } | null;
}

export default function PainelRastreamento() {
  const router = useRouter();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [motorista, setMotorista] = useState<Motorista | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);

      const res = await fetch('/api/painel/me');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const error = await res.json();
        throw new Error(error.error || 'Erro ao carregar dados');
      }

      const dados = await res.json();
      setMotorista(dados);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar dados',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <PainelLayout 
        title="Rastreamento"
        breadcrumbs={[{ label: 'Rastreamento' }]}
      >
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="green.500" />
          <Text mt={4} color="gray.600">Carregando...</Text>
        </Box>
      </PainelLayout>
    );
  }

  if (!motorista) {
    return (
      <PainelLayout 
        title="Rastreamento"
        breadcrumbs={[{ label: 'Rastreamento' }]}
      >
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            Não foi possível carregar seus dados. Tente novamente.
          </AlertDescription>
        </Alert>
      </PainelLayout>
    );
  }

  // Se for afiliado, não tem acesso ao rastreamento
  if (motorista.type === 'affiliate') {
    return (
      <PainelLayout 
        title="Rastreamento"
        subtitle="Dados de quilometragem e localização"
        breadcrumbs={[{ label: 'Rastreamento' }]}
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
            Rastreamento não disponível
          </AlertTitle>
          <AlertDescription maxW="md" fontSize="md">
            Como motorista afiliado com veículo próprio, você não tem acesso ao rastreamento Cartrack.
            <br /><br />
            Para informações sobre suas viagens, consulte os aplicativos Uber e Bolt.
          </AlertDescription>
        </Alert>
      </PainelLayout>
    );
  }

  // Se for locatário mas não tem veículo atribuído
  if (!motorista.vehicle) {
    return (
      <PainelLayout 
        title="Rastreamento"
        subtitle="Dados de quilometragem e localização"
        breadcrumbs={[{ label: 'Rastreamento' }]}
      >
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Veículo não atribuído</AlertTitle>
          <AlertDescription>
            Você ainda não tem um veículo atribuído. Entre em contato com o administrador.
          </AlertDescription>
        </Alert>
      </PainelLayout>
    );
  }

  // Se for locatário com veículo
  return (
    <PainelLayout 
      title="Rastreamento"
      subtitle="Dados de quilometragem e localização do seu veículo"
      breadcrumbs={[{ label: 'Rastreamento' }]}
    >
      {/* Informações do Veículo */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
        <HStack mb={4}>
          <Icon as={FiTruck} boxSize={5} color="green.500" />
          <Text fontSize="lg" fontWeight="bold">Veículo</Text>
        </HStack>
        
        <HStack spacing={8}>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>Matrícula</Text>
            <Text fontSize="xl" fontWeight="bold" fontFamily="mono">
              {motorista.vehicle.plate}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>Modelo</Text>
            <Text fontSize="xl" fontWeight="bold">
              {motorista.vehicle.model}
            </Text>
          </Box>
        </HStack>
      </Box>

      {/* Alerta de Integração Pendente */}
      <Alert status="info" borderRadius="lg">
        <AlertIcon />
        <Box>
          <AlertTitle fontSize="sm">Integração com Cartrack em desenvolvimento</AlertTitle>
          <AlertDescription fontSize="sm">
            Em breve você poderá visualizar dados de quilometragem, tempo de condução e localização do seu veículo em tempo real.
          </AlertDescription>
        </Box>
      </Alert>

      {/* Preview de como será (mockup) */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Box bg="gray.100" p={6} borderRadius="lg" borderWidth="1px" borderColor="gray.300">
          <Stat>
            <StatLabel color="gray.600">
              <HStack>
                <Icon as={FiActivity} />
                <Text>Quilometragem Hoje</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="gray.400">--- km</StatNumber>
            <StatHelpText color="gray.500">Em breve</StatHelpText>
          </Stat>
        </Box>

        <Box bg="gray.100" p={6} borderRadius="lg" borderWidth="1px" borderColor="gray.300">
          <Stat>
            <StatLabel color="gray.600">
              <HStack>
                <Icon as={FiClock} />
                <Text>Tempo em Movimento</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="gray.400">-- h --min</StatNumber>
            <StatHelpText color="gray.500">Em breve</StatHelpText>
          </Stat>
        </Box>

        <Box bg="gray.100" p={6} borderRadius="lg" borderWidth="1px" borderColor="gray.300">
          <Stat>
            <StatLabel color="gray.600">
              <HStack>
                <Icon as={FiMapPin} />
                <Text>Última Localização</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="gray.400">---</StatNumber>
            <StatHelpText color="gray.500">Em breve</StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Estatísticas da Semana (mockup) */}
      <Box bg="gray.100" p={6} borderRadius="lg" borderWidth="1px" borderColor="gray.300">
        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.600">
          Estatísticas da Semana Atual
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>Quilometragem Total</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.400">--- km</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>Dias Trabalhados</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.400">-</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>Média Diária</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.400">--- km</Text>
          </Box>
        </SimpleGrid>
      </Box>
    </PainelLayout>
  );
}
