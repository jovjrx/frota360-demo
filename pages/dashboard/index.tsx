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
import PainelLayout from '@/components/layouts/DashboardLayout';
import Link from 'next/link';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import { getTranslation } from '@/lib/translations';

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

interface PainelDashboardProps extends DashboardPageProps {
  motorista: Motorista;
  contracheques: Contracheque[];
}

export default function PainelDashboard({ 
  motorista, 
  contracheques, 
  translations,
  locale 
}: PainelDashboardProps) {
  const router = useRouter();
  const toast = useToast();
  
  // Calcular último pagamento e semana atual
  const ultimoPagamento = contracheques?.find((c: Contracheque) => c.paymentStatus === 'paid') || null;
  const semanaAtual = contracheques?.find((c: Contracheque) => c.paymentStatus === 'pending') || null;
  // Funções de tradução com fallbacks
  const t = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations?.common, key, variables) || key;
  };

  const tPainel = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations?.dashboard, key, variables) || key;
  };

  // Status da conta
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
                href="/dashboard/contracheques"
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
                href="/dashboard/contracheques"
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
            href="/dashboard/dados"
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
            href="/dashboard/contracheques"
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
              href="/dashboard/rastreamento"
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
            href="/dashboard/ajuda"
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

export const getServerSideProps = withDashboardSSR(
  { loadDriverData: true, loadContracheques: true, contrachequeLimit: 10 },
  async (context, user, driverId) => {
    // motorista e contracheques já vêm automaticamente nas props base
    // Aqui só precisamos processar e retornar dados adicionais
    return {};
  }
);
