import { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Divider,
} from '@chakra-ui/react';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiTruck,
  FiAlertCircle,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import PainelLayout from '@/components/layouts/PainelLayout';

interface Motorista {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string | null;
  city: string;
  status: string;
  type: 'affiliate' | 'renter';
  banking: {
    iban: string | null;
    accountHolder: string | null;
  };
  vehicle: {
    plate: string;
    model: string;
    assignedDate: string;
  } | null;
  rentalFee: number;
  createdAt: string;
  activatedAt: string | null;
}

export default function PainelDados() {
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
        title="Meus Dados"
        breadcrumbs={[{ label: 'Meus Dados' }]}
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
        title="Meus Dados"
        breadcrumbs={[{ label: 'Meus Dados' }]}
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

  const statusColor = motorista.status === 'active' ? 'green' : 
                      motorista.status === 'pending' ? 'yellow' : 'red';
  
  const statusLabel = motorista.status === 'active' ? 'Ativo' :
                      motorista.status === 'pending' ? 'Pendente' :
                      motorista.status === 'suspended' ? 'Suspenso' : 'Inativo';

  const tipoLabel = motorista.type === 'renter' ? 'Locatário' : 'Afiliado';

  return (
    <PainelLayout 
      title="Meus Dados"
      subtitle="Informações da sua conta"
      breadcrumbs={[{ label: 'Meus Dados' }]}
    >
      {/* Alerta de somente leitura */}
      <Alert status="info" borderRadius="lg">
        <AlertIcon />
        <Box>
          <AlertTitle fontSize="sm">Dados somente leitura</AlertTitle>
          <AlertDescription fontSize="sm">
            Para alterar seus dados, entre em contato com o administrador.
          </AlertDescription>
        </Box>
      </Alert>

      {/* Dados Pessoais */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
        <HStack mb={4}>
          <Icon as={FiUser} boxSize={5} color="green.500" />
          <Text fontSize="lg" fontWeight="bold">Dados Pessoais</Text>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>Nome Completo</Text>
            <Text fontSize="md" fontWeight="semibold">{motorista.fullName}</Text>
          </Box>
          
          <Box>
            <HStack>
              <Text fontSize="sm" color="gray.600" mb={1}>Status</Text>
              <Badge colorScheme={statusColor} fontSize="xs">
                {statusLabel}
              </Badge>
            </HStack>
            <Text fontSize="md" fontWeight="semibold">{tipoLabel}</Text>
          </Box>
          
          <Box>
            <HStack spacing={2} mb={1}>
              <Icon as={FiMail} boxSize={4} color="gray.500" />
              <Text fontSize="sm" color="gray.600">Email</Text>
            </HStack>
            <Text fontSize="md" fontWeight="semibold">{motorista.email}</Text>
          </Box>
          
          <Box>
            <HStack spacing={2} mb={1}>
              <Icon as={FiPhone} boxSize={4} color="gray.500" />
              <Text fontSize="sm" color="gray.600">Telefone</Text>
            </HStack>
            <Text fontSize="md" fontWeight="semibold">{motorista.phone || '-'}</Text>
          </Box>
          
          {motorista.birthDate && (
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Data de Nascimento</Text>
              <Text fontSize="md" fontWeight="semibold">
                {new Date(motorista.birthDate).toLocaleDateString('pt-BR')}
              </Text>
            </Box>
          )}
          
          {motorista.city && (
            <Box>
              <HStack spacing={2} mb={1}>
                <Icon as={FiMapPin} boxSize={4} color="gray.500" />
                <Text fontSize="sm" color="gray.600">Cidade</Text>
              </HStack>
              <Text fontSize="md" fontWeight="semibold">{motorista.city}</Text>
            </Box>
          )}
        </SimpleGrid>
      </Box>

      {/* Dados Bancários */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
        <HStack mb={4}>
          <Icon as={FiCreditCard} boxSize={5} color="green.500" />
          <Text fontSize="lg" fontWeight="bold">Dados Bancários</Text>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>IBAN</Text>
            <Text fontSize="md" fontWeight="semibold" fontFamily="mono">
              {motorista.banking.iban || '-'}
            </Text>
            <Text fontSize="xs" color="gray.500" mt={1}>
              (Dados mascarados por segurança)
            </Text>
          </Box>
          
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>Titular da Conta</Text>
            <Text fontSize="md" fontWeight="semibold">
              {motorista.banking.accountHolder || '-'}
            </Text>
          </Box>
        </SimpleGrid>
        
        <Alert status="warning" mt={4} borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">
            Para alterar seus dados bancários, entre em contato com o administrador.
          </Text>
        </Alert>
      </Box>

      {/* Veículo (se locatário) */}
      {motorista.type === 'renter' && motorista.vehicle && (
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
          <HStack mb={4}>
            <Icon as={FiTruck} boxSize={5} color="green.500" />
            <Text fontSize="lg" fontWeight="bold">Veículo Atribuído</Text>
          </HStack>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Matrícula</Text>
              <Text fontSize="md" fontWeight="semibold" fontFamily="mono">
                {motorista.vehicle.plate}
              </Text>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Modelo</Text>
              <Text fontSize="md" fontWeight="semibold">
                {motorista.vehicle.model}
              </Text>
            </Box>
            
            {motorista.vehicle.assignedDate && (
              <Box>
                <Text fontSize="sm" color="gray.600" mb={1}>Data de Atribuição</Text>
                <Text fontSize="md" fontWeight="semibold">
                  {new Date(motorista.vehicle.assignedDate).toLocaleDateString('pt-BR')}
                </Text>
              </Box>
            )}
          </SimpleGrid>
          
          {motorista.rentalFee > 0 && (
            <>
              <Divider my={4} />
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Aluguel Semanal</Text>
                <Text fontSize="lg" fontWeight="bold" color="orange.600">
                  €{motorista.rentalFee.toFixed(2)}
                </Text>
              </HStack>
            </>
          )}
        </Box>
      )}

      {/* Informações da Conta */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
        <HStack mb={4}>
          <Icon as={FiAlertCircle} boxSize={5} color="green.500" />
          <Text fontSize="lg" fontWeight="bold">Informações da Conta</Text>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>Data de Cadastro</Text>
            <Text fontSize="md" fontWeight="semibold">
              {new Date(motorista.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
          </Box>
          
          {motorista.activatedAt && (
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Data de Ativação</Text>
              <Text fontSize="md" fontWeight="semibold">
                {new Date(motorista.activatedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </Box>
          )}
        </SimpleGrid>
      </Box>
    </PainelLayout>
  );
}
