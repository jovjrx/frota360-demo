import { GetServerSideProps } from 'next';
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
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
import PainelLayout from '@/components/layouts/DashboardLayout';
import { PageProps } from '@/interface/Global';
import { checkDriverAuth } from '@/lib/auth/driverCheck';
import { getTranslation } from '@/lib/translations';

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

interface PainelDadosProps extends PageProps {
  motorista: Motorista;
  translations: {
    common: any;
    page: any;
  };
}

export default function PainelDados({ motorista, translations }: PainelDadosProps) {
  // Funções de tradução com fallbacks
  const t = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations?.common, key, variables) || key;
  };

  const tPainel = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations?.page, key, variables) || key;
  };

  // Status e labels
  const statusColor = motorista.status === 'active' ? 'green' :
                      motorista.status === 'pending' ? 'yellow' : 'red';
  
  const statusLabel = motorista.status === 'active' ? 'Ativo' :
                      motorista.status === 'pending' ? 'Pendente' :
                      motorista.status === 'suspended' ? 'Suspenso' : 'Inativo';

  const tipoLabel = motorista.type === 'renter' ? 'Locatário' : 'Afiliado';

  // Formatar datas
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <PainelLayout 
      title={tPainel('data.title') || 'Meus Dados'}
      subtitle={tPainel('data.subtitle') || 'Visualize suas informações cadastrais'}
      breadcrumbs={[{ label: tPainel('data.breadcrumb') || 'Meus Dados' }]}
    >
      {/* Status da Conta */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" mb={6}>
        <HStack justify="space-between" mb={4}>
          <HStack>
            <Icon as={FiUser} color="green.500" boxSize={5} />
            <Text fontWeight="semibold" fontSize="lg">
              {t('account.status') || 'Status da Conta'}
            </Text>
          </HStack>
          <Badge colorScheme={statusColor} variant="solid" px={3} py={1}>
            {statusLabel}
          </Badge>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              {t('account.type') || 'Tipo de Conta'}
            </Text>
            <Text>{tipoLabel}</Text>
          </Box>
          
          {motorista.activatedAt && (
            <Box>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                {t('account.activated_at') || 'Ativada em'}
              </Text>
              <Text>{formatDate(motorista.activatedAt)}</Text>
            </Box>
          )}
        </SimpleGrid>
      </Box>

      {/* Dados Pessoais */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" mb={6}>
        <HStack mb={4}>
          <Icon as={FiUser} color="green.500" boxSize={5} />
          <Text fontWeight="semibold" fontSize="lg">
            {t('personal.title') || 'Dados Pessoais'}
          </Text>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <VStack align="start" spacing={4}>
            <Box>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                {t('personal.full_name') || 'Nome Completo'}
              </Text>
              <Text fontWeight="medium">{motorista.fullName}</Text>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                <Icon as={FiMail} mr={1} />
                {t('personal.email') || 'Email'}
              </Text>
              <Text>{motorista.email}</Text>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                <Icon as={FiPhone} mr={1} />
                {t('personal.phone') || 'Telefone'}
              </Text>
              <Text>{motorista.phone || 'Não informado'}</Text>
            </Box>
          </VStack>
          
          <VStack align="start" spacing={4}>
            <Box>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                {t('personal.birth_date') || 'Data de Nascimento'}
              </Text>
              <Text>{formatDate(motorista.birthDate)}</Text>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                <Icon as={FiMapPin} mr={1} />
                {t('personal.city') || 'Cidade'}
              </Text>
              <Text>{motorista.city || 'Não informado'}</Text>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                {t('personal.member_since') || 'Membro desde'}
              </Text>
              <Text>{formatDate(motorista.createdAt)}</Text>
            </Box>
          </VStack>
        </SimpleGrid>
      </Box>

      {/* Dados Bancários */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" mb={6}>
        <HStack mb={4}>
          <Icon as={FiCreditCard} color="green.500" boxSize={5} />
          <Text fontWeight="semibold" fontSize="lg">
            {t('banking.title') || 'Dados Bancários'}
          </Text>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              {t('banking.iban') || 'IBAN'}
            </Text>
            <Text fontFamily="mono" fontSize="sm">
              {motorista.banking.iban || 'Não informado'}
            </Text>
          </Box>
          
          <Box>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              {t('banking.account_holder') || 'Titular da Conta'}
            </Text>
            <Text>{motorista.banking.accountHolder || 'Não informado'}</Text>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Dados do Veículo (se locatário) */}
      {motorista.type === 'renter' && motorista.vehicle && (
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" mb={6}>
          <HStack mb={4}>
            <Icon as={FiTruck} color="green.500" boxSize={5} />
            <Text fontWeight="semibold" fontSize="lg">
              {t('vehicle.title') || 'Veículo Atribuído'}
            </Text>
          </HStack>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Box>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                {t('vehicle.plate') || 'Matrícula'}
              </Text>
              <Text fontWeight="medium">{motorista.vehicle.plate}</Text>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                {t('vehicle.model') || 'Modelo'}
              </Text>
              <Text>{motorista.vehicle.model}</Text>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                {t('vehicle.assigned_date') || 'Data de Atribuição'}
              </Text>
              <Text>{formatDate(motorista.vehicle.assignedDate)}</Text>
            </Box>
          </SimpleGrid>
          
          {motorista.rentalFee > 0 && (
            <>
              <Divider my={4} />
              <Box>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  {t('vehicle.rental_fee') || 'Taxa de Aluguel Semanal'}
                </Text>
                <Text fontWeight="semibold" color="orange.600">
                  €{motorista.rentalFee.toFixed(2)}
                </Text>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Avisos importantes */}
      {motorista.status !== 'active' && (
        <Box bg="orange.50" p={4} borderRadius="lg" borderLeft="4px" borderLeftColor="orange.500">
          <HStack>
            <Icon as={FiAlertCircle} color="orange.500" />
            <VStack align="start" spacing={1}>
              <Text fontWeight="semibold" color="orange.800">
                {t('warnings.account_not_active') || 'Conta não ativa'}
              </Text>
              <Text fontSize="sm" color="orange.700">
                {t('warnings.contact_support') || 'Entre em contato com o suporte para mais informações.'}
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}
    </PainelLayout>
  );
}

export const getServerSideProps: GetServerSideProps<PainelDadosProps> = async (context) => {
  try {
    // Verificar autenticação e carregar dados do motorista
    const authResult = await checkDriverAuth(context, {
      loadDriverData: true,
    });

    // Se houve redirecionamento, retornar
    if ('redirect' in authResult) {
      return authResult;
    }

    const { props } = authResult;

    return {
      props: {
        ...props,
        motorista: props.motorista,
      },
    };

  } catch (error) {
    console.error('Erro no getServerSideProps do painel/dados:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};