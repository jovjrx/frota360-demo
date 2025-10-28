import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
  Icon,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useClipboard,
  useToast,
  Divider,
} from '@chakra-ui/react';
import {
  FiCopy,
  FiShare2,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiSearch,
} from 'react-icons/fi';
import Head from 'next/head';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import { getTranslation } from '@/lib/translations';

interface ReferredDriver {
  id: string;
  fullName: string;
  email: string;
  status: 'PENDING' | 'PAYABLE' | 'PAID';
  weeksWorked: number;
  bonusAmount: number;
  referralDate: string;
}

interface PageProps extends DashboardPageProps {
  referralLink: string;
  referredDrivers: ReferredDriver[];
  totalBonus: number;
  paidBonus: number;
}

export default function ReferralPage({ 
  translations,
  referralLink,
  referredDrivers,
  totalBonus,
  paidBonus,
}: PageProps) {
  const t = (key: string) => getTranslation(translations?.common, key);
  const toast = useToast();
  const { hasCopied, onCopy } = useClipboard(referralLink);

  const handleCopyLink = () => {
    onCopy();
    toast({
      title: t('actions.success'),
      description: 'Link de indicação copiado para a área de transferência!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'yellow';
      case 'PAYABLE':
        return 'blue';
      case 'PAID':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'PAYABLE':
        return 'Disponível';
      case 'PAID':
        return 'Pago';
      default:
        return status;
    }
  };

  return (
    <>
      <Head>
        <title>{t('seo.pages.referral.title')} - Conduz</title>
        <meta name="description" content={t('seo.pages.referral.description')} />
        <meta name="keywords" content={t('seo.pages.referral.keywords')} />
      </Head>

      <DashboardLayout title="Indicações" subtitle="Convide novos motoristas e ganhe comissões!" translations={translations}>
        <Box py={8}>
          <VStack spacing={8} align="stretch">
            {/* Referral Link Card */}
            <Card>
              <CardHeader bg="blue.50">
                <Heading size="md">Seu Link de Indicação</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text color="gray.700">
                    Compartilhe este link com amigos e motoristas para ganhar comissões:
                  </Text>
                  <HStack spacing={2}>
                    <Input
                      value={referralLink}
                      isReadOnly
                      bg="gray.100"
                      borderRadius="lg"
                    />
                    <Button
                      leftIcon={<FiCopy />}
                      onClick={handleCopyLink}
                      colorScheme="blue"
                      variant="solid"
                    >
                      {hasCopied ? 'Copiado!' : 'Copiar'}
                    </Button>
                    <Button
                      leftIcon={<FiShare2 />}
                      colorScheme="blue"
                      variant="outline"
                    >
                      Partilhar
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Summary Cards */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Card>
                <CardBody>
                  <VStack spacing={4} align="start">
                    <HStack justify="space-between" width="100%">
                      <Text fontSize="sm" color="gray.600">
                        Total de Indicações
                      </Text>
                      <Icon as={FiUsers} boxSize={6} color="blue.500" />
                    </HStack>
                    <Heading size="lg">{referredDrivers.length}</Heading>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <VStack spacing={4} align="start">
                    <HStack justify="space-between" width="100%">
                      <Text fontSize="sm" color="gray.600">
                        Comissões Totais
                      </Text>
                      <Icon as={FiDollarSign} boxSize={6} color="green.500" />
                    </HStack>
                    <Heading size="lg">€ {totalBonus.toFixed(2)}</Heading>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <VStack spacing={4} align="start">
                    <HStack justify="space-between" width="100%">
                      <Text fontSize="sm" color="gray.600">
                        Comissões Pagas
                      </Text>
                      <Icon as={FiCheckCircle} boxSize={6} color="green.600" />
                    </HStack>
                    <Heading size="lg">€ {paidBonus.toFixed(2)}</Heading>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Referred Drivers Table */}
            <Card>
              <CardHeader>
                <Heading size="md">Motoristas Indicados</Heading>
              </CardHeader>
              <CardBody>
                {referredDrivers.length === 0 ? (
                  <VStack py={8} spacing={2}>
                    <Icon as={FiUsers} boxSize={12} color="gray.300" />
                    <Text color="gray.600" textAlign="center">
                      Nenhum motorista indicado ainda. Comece a compartilhar seu link!
                    </Text>
                  </VStack>
                ) : (
                  <Box overflowX="auto">
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr bg="gray.50">
                          <Th>Nome</Th>
                          <Th>Email</Th>
                          <Th textAlign="center">Semanas</Th>
                          <Th textAlign="center">Status</Th>
                          <Th isNumeric>Comissão</Th>
                          <Th>Data</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {referredDrivers.map((driver) => (
                          <Tr key={driver.id}>
                            <Td fontWeight="medium">{driver.fullName}</Td>
                            <Td fontSize="sm">{driver.email}</Td>
                            <Td textAlign="center">
                              <Badge colorScheme="gray">
                                {driver.weeksWorked}
                              </Badge>
                            </Td>
                            <Td textAlign="center">
                              <Badge colorScheme={getStatusColor(driver.status)}>
                                {getStatusLabel(driver.status)}
                              </Badge>
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              € {driver.bonusAmount.toFixed(2)}
                            </Td>
                            <Td fontSize="sm" color="gray.600">
                              {new Date(driver.referralDate).toLocaleDateString('pt-PT')}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
            </Card>
          </VStack>
        </Box>
      </DashboardLayout>
    </>
  );
}

export const getServerSideProps = withDashboardSSR(
  { loadDriverData: true },
  async (context, user, driverId) => {
    // TODO: Buscar dados de referral do Firestore
    const referralLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://conduz.pt'}/${driverId}`;
    const referredDrivers: ReferredDriver[] = [];
    const totalBonus = 0;
    const paidBonus = 0;

    return {
      referralLink,
      referredDrivers,
      totalBonus,
      paidBonus,
    };
  }
);

