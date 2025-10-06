import { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  Divider,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FiUser,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import PainelLayout from '@/components/layouts/PainelLayout';
import Link from 'next/link';

interface Motorista {
  id: string;
  fullName: string;
  email: string;
  status: string;
  type: 'affiliate' | 'renter';
  vehicle: {
    plate: string;
    model: string;
  } | null;
  createdAt: string;
}

interface Contracheque {
  id: string;
  weekStart: string;
  weekEnd: string;
  ganhosTotal: number;
  repasse: number;
  paymentStatus: string;
  paymentDate: string | null;
}

export default function PainelDashboard() {
  const router = useRouter();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [motorista, setMotorista] = useState<Motorista | null>(null);
  const [ultimoPagamento, setUltimoPagamento] = useState<Contracheque | null>(null);
  const [semanaAtual, setSemanaAtual] = useState<Contracheque | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);

      // Buscar dados do motorista
      const resMotorista = await fetch('/api/painel/me');
      if (!resMotorista.ok) {
        const error = await resMotorista.json();
        if (resMotorista.status === 401) {
          router.push('/login');
          return;
        }
        if (resMotorista.status === 403) {
          toast({
            title: 'Conta não ativa',
            description: `Seu status atual é: ${error.status}`,
            status: 'warning',
            duration: 5000,
          });
          return;
        }
        throw new Error(error.error || 'Erro ao carregar dados');
      }
      const dadosMotorista = await resMotorista.json();
      setMotorista(dadosMotorista);

      // Buscar contracheques
      const resContracheques = await fetch('/api/painel/contracheques?limit=2');
      if (resContracheques.ok) {
        const { contracheques } = await resContracheques.json();
        
        // Último pagamento (pago mais recente)
        const pago = contracheques.find((c: Contracheque) => c.paymentStatus === 'paid');
        if (pago) setUltimoPagamento(pago);
        
        // Semana atual (pendente mais recente)
        const pendente = contracheques.find((c: Contracheque) => c.paymentStatus === 'pending');
        if (pendente) setSemanaAtual(pendente);
      }

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
      <PainelLayout title="Dashboard">
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="green.500" />
          <Text mt={4} color="gray.600">Carregando...</Text>
        </Box>
      </PainelLayout>
    );
  }

  if (!motorista) {
    return (
      <PainelLayout title="Dashboard">
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

  const statusColor = motorista.status === 'active' ? 'green' : 
                      motorista.status === 'pending' ? 'yellow' : 'red';
  
  const statusLabel = motorista.status === 'active' ? 'Ativo' :
                      motorista.status === 'pending' ? 'Pendente' :
                      motorista.status === 'suspended' ? 'Suspenso' : 'Inativo';

  const tipoLabel = motorista.type === 'renter' ? 'Locatário' : 'Afiliado';

  return (
    <PainelLayout 
      title={`Bem-vindo, ${motorista.fullName.split(' ')[0]}!`}
      subtitle="Acompanhe seus ganhos e pagamentos"
    >
      {/* Status da Conta */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
        <HStack justify="space-between" mb={4}>
          <HStack spacing={4}>
            <Icon as={FiUser} boxSize={6} color="green.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold">Status da Conta</Text>
              <Text fontSize="sm" color="gray.600">{motorista.email}</Text>
            </VStack>
          </HStack>
          <Badge colorScheme={statusColor} fontSize="md" px={3} py={1}>
            {statusLabel}
          </Badge>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Box>
            <Text fontSize="sm" color="gray.600">Tipo</Text>
            <Text fontSize="md" fontWeight="semibold">{tipoLabel}</Text>
          </Box>
          
          {motorista.vehicle && (
            <Box>
              <Text fontSize="sm" color="gray.600">Veículo</Text>
              <Text fontSize="md" fontWeight="semibold">
                {motorista.vehicle.model} - {motorista.vehicle.plate}
              </Text>
            </Box>
          )}
          
          <Box>
            <Text fontSize="sm" color="gray.600">Cadastro</Text>
            <Text fontSize="md" fontWeight="semibold">
              {new Date(motorista.createdAt).toLocaleDateString('pt-BR')}
            </Text>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Resumo Financeiro */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Último Pagamento */}
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
          <HStack mb={4}>
            <Icon as={FiCheckCircle} boxSize={5} color="green.500" />
            <Text fontSize="lg" fontWeight="bold">Último Pagamento</Text>
          </HStack>
          
          {ultimoPagamento ? (
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Semana</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  {new Date(ultimoPagamento.weekStart).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date(ultimoPagamento.weekEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Ganhos Total</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  €{ultimoPagamento.ganhosTotal.toFixed(2)}
                </Text>
              </HStack>
              
              <Divider />
              
              <HStack justify="space-between">
                <Text fontSize="md" fontWeight="bold">Valor Recebido</Text>
                <Text fontSize="xl" fontWeight="bold" color="green.600">
                  €{ultimoPagamento.repasse.toFixed(2)}
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">Pago em</Text>
                <Text fontSize="xs" color="gray.500">
                  {ultimoPagamento.paymentDate 
                    ? new Date(ultimoPagamento.paymentDate).toLocaleDateString('pt-BR')
                    : '-'}
                </Text>
              </HStack>
              
              <Button
                as={Link}
                href="/painel/contracheques"
                size="sm"
                colorScheme="green"
                variant="outline"
                leftIcon={<Icon as={FiFileText} />}
              >
                Ver Contracheque
              </Button>
            </VStack>
          ) : (
            <Text color="gray.500" fontSize="sm">
              Nenhum pagamento realizado ainda
            </Text>
          )}
        </Box>

        {/* Semana Atual */}
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
          <HStack mb={4}>
            <Icon as={FiClock} boxSize={5} color="orange.500" />
            <Text fontSize="lg" fontWeight="bold">Semana Atual</Text>
          </HStack>
          
          {semanaAtual ? (
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Período</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  {new Date(semanaAtual.weekStart).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date(semanaAtual.weekEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Ganhos Total</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  €{semanaAtual.ganhosTotal.toFixed(2)}
                </Text>
              </HStack>
              
              <Divider />
              
              <HStack justify="space-between">
                <Text fontSize="md" fontWeight="bold">Repasse Estimado</Text>
                <Text fontSize="xl" fontWeight="bold" color="orange.500">
                  €{semanaAtual.repasse.toFixed(2)}
                </Text>
              </HStack>
              
              <Badge colorScheme="orange" fontSize="xs" textAlign="center">
                Aguardando Processamento
              </Badge>
              
              <Button
                as={Link}
                href="/painel/contracheques"
                size="sm"
                colorScheme="orange"
                variant="outline"
                leftIcon={<Icon as={FiFileText} />}
              >
                Ver Detalhes
              </Button>
            </VStack>
          ) : (
            <Text color="gray.500" fontSize="sm">
              Nenhum registro para a semana atual
            </Text>
          )}
        </Box>
      </SimpleGrid>

      {/* Acesso Rápido */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
        <Text fontSize="lg" fontWeight="bold" mb={4}>Acesso Rápido</Text>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Button
            as={Link}
            href="/painel/dados"
            variant="outline"
            colorScheme="green"
            leftIcon={<Icon as={FiUser} />}
            size="lg"
            height="auto"
            py={4}
            flexDirection="column"
          >
            <Text fontSize="sm">Meus Dados</Text>
          </Button>
          
          <Button
            as={Link}
            href="/painel/contracheques"
            variant="outline"
            colorScheme="green"
            leftIcon={<Icon as={FiFileText} />}
            size="lg"
            height="auto"
            py={4}
            flexDirection="column"
          >
            <Text fontSize="sm">Contracheques</Text>
          </Button>
          
          {motorista.type === 'renter' && (
            <Button
              as={Link}
              href="/painel/rastreamento"
              variant="outline"
              colorScheme="green"
              leftIcon={<Icon as={FiCalendar} />}
              size="lg"
              height="auto"
              py={4}
              flexDirection="column"
            >
              <Text fontSize="sm">Rastreamento</Text>
            </Button>
          )}
          
          <Button
            as={Link}
            href="/painel/ajuda"
            variant="outline"
            colorScheme="green"
            leftIcon={<Icon as={FiFileText} />}
            size="lg"
            height="auto"
            py={4}
            flexDirection="column"
          >
            <Text fontSize="sm">Ajuda</Text>
          </Button>
        </SimpleGrid>
      </Box>
    </PainelLayout>
  );
}
