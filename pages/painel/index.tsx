import { GetServerSideProps } from 'next';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { loadTranslations, getTranslation } from '@/lib/translations';
import LoggedInLayout from '@/components/LoggedInLayout';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebaseAdmin';
import { COMMON } from '@/translations';

interface DriverDashboardProps {
  translations: any;
  locale: string;
  driver: {
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    driverType: string;
    isApproved: boolean;
    adminNotes?: string;
    rejectionReason?: string;
  };
}

export default function DriverDashboard({ translations, locale, driver }: DriverDashboardProps) {
  const t = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.common, key, variables);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'inactive':
        return 'gray';
      case 'suspended':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return t(COMMON.STATUS.APPROVED);
      case 'pending':
        return t(COMMON.STATUS.PENDING);
      case 'inactive':
        return t(COMMON.STATUS.INACTIVE);
      case 'suspended':
        return t(COMMON.STATUS.SUSPENDED);
      case 'rejected':
        return t(COMMON.STATUS.REJECTED);
      default:
        return status;
    }
  };

  const getDriverTypeLabel = (type: string) => {
    return type === 'affiliate' ? 'Afiliado' : 'Locatário';
  };

  return (
    <LoggedInLayout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>
              Bem-vindo, {driver.firstName}!
            </Heading>
            <Text color="gray.600">
              Painel do Motorista
            </Text>
          </Box>

          {/* Status da Conta */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Status da Sua Conta</Heading>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>Status Atual:</Text>
                  <Badge colorScheme={getStatusColor(driver.status)} fontSize="lg" px={4} py={2}>
                    {getStatusLabel(driver.status)}
                  </Badge>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>Tipo de Motorista:</Text>
                  <Badge colorScheme={driver.driverType === 'affiliate' ? 'green' : 'blue'} fontSize="lg" px={4} py={2}>
                    {getDriverTypeLabel(driver.driverType)}
                  </Badge>
                </Box>

                {driver.status === 'pending' && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Candidatura em Análise</AlertTitle>
                      <AlertDescription>
                        A sua candidatura está a ser analisada pela nossa equipa. 
                        Entraremos em contacto em breve.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {driver.status === 'active' && driver.isApproved && (
                  <Alert status="success" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Conta Aprovada!</AlertTitle>
                      <AlertDescription>
                        A sua conta foi aprovada e está ativa. 
                        Em breve terá acesso a mais funcionalidades.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {driver.status === 'rejected' && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Candidatura Rejeitada</AlertTitle>
                      <AlertDescription>
                        {driver.rejectionReason || 'A sua candidatura foi rejeitada. Por favor, entre em contacto conosco para mais informações.'}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {driver.status === 'suspended' && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Conta Suspensa</AlertTitle>
                      <AlertDescription>
                        A sua conta foi suspensa. Por favor, entre em contacto com o suporte.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {driver.adminNotes && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Nota da Administração</AlertTitle>
                      <AlertDescription>
                        {driver.adminNotes}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Informações */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Informações da Conta</Heading>
                
                <Box>
                  <Text fontWeight="bold" color="gray.600" fontSize="sm">Nome Completo</Text>
                  <Text fontSize="lg">{driver.firstName} {driver.lastName}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" color="gray.600" fontSize="sm">Email</Text>
                  <Text fontSize="lg">{driver.email}</Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Próximos Passos */}
          {driver.status === 'pending' && (
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Próximos Passos</Heading>
                  
                  <Text>
                    1. A nossa equipa está a analisar a sua candidatura
                  </Text>
                  <Text>
                    2. Entraremos em contacto por email ou telefone
                  </Text>
                  <Text>
                    3. Após aprovação, receberá acesso completo à plataforma
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>
    </LoggedInLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const session = await getSession(context.req, context.res);

    // Verificar se está logado e se tem role de driver
    if (!session?.isLoggedIn || (session.role !== 'driver' && session.user?.role !== 'driver')) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Buscar dados do motorista
    const driverId = session.userId || session.user?.id;
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    
    if (!driverDoc.exists) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    const driverData = driverDoc.data();

    const locale = Array.isArray(context.req.headers['x-locale'])
      ? context.req.headers['x-locale'][0]
      : context.req.headers['x-locale'] || 'pt';

    const translations = await loadTranslations(locale, ['common']);

    return {
      props: {
        translations,
        locale,
        driver: {
          firstName: driverData?.firstName || '',
          lastName: driverData?.lastName || '',
          email: driverData?.email || '',
          status: driverData?.status || 'pending',
          driverType: driverData?.driverType || 'affiliate',
          isApproved: driverData?.isApproved || false,
          adminNotes: driverData?.adminNotes || '',
          rejectionReason: driverData?.rejectionReason || '',
        },
      },
    };
  } catch (error) {
    console.error('Failed to load driver data:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};
