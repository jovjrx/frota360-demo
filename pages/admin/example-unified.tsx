/**
 * Exemplo de Página Admin usando Unified Data Service
 * 
 * Este arquivo demonstra as melhores práticas de uso do serviço unificado
 */

import { GetServerSideProps } from 'next';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  useToast,
} from '@chakra-ui/react';
import { FiRefreshCw, FiDollarSign, FiTruck, FiUsers } from 'react-icons/fi';
import LoggedInLayout from '@/components/LoggedInLayout';
import { UnifiedAdminData } from '@/lib/admin/unified-data';
import { useDashboardData } from '@/lib/hooks/useUnifiedData';
import { PageProps } from '@/interface/Global';

interface ExamplePageProps extends PageProps {
  initialData: UnifiedAdminData;
}

export default function ExampleAdminPage({ initialData, tCommon, tPage }: ExamplePageProps) {
  const toast = useToast();
  
  // Hook para atualização manual (opcional)
  const { data: updatedData, loading, refetch } = useDashboardData(30);
  
  // Usar dados atualizados se disponíveis, senão usar dados iniciais do SSR
  const data = updatedData || initialData;

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: 'Dados atualizados',
      status: 'success',
      duration: 2000,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <LoggedInLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <Box>
              <Heading size="xl">Dashboard Unificado</Heading>
              <Text color="gray.600" mt={2}>
                Período: {data.period.startDate} até {data.period.endDate} ({data.period.days} dias)
              </Text>
            </Box>
            <Button
              leftIcon={<FiRefreshCw />}
              onClick={handleRefresh}
              isLoading={loading}
              colorScheme="blue"
            >
              Atualizar
            </Button>
          </HStack>

          {/* Alertas de erro */}
          {data.errors.length > 0 && (
            <Card bg="red.50" borderColor="red.200" borderWidth={1}>
              <CardBody>
                <Heading size="sm" color="red.700" mb={2}>
                  Avisos ({data.errors.length})
                </Heading>
                {data.errors.map((error, idx) => (
                  <Text key={idx} fontSize="sm" color="red.600">
                    • {error}
                  </Text>
                ))}
              </CardBody>
            </Card>
          )}

          {/* KPIs Financeiros */}
          <Box>
            <Heading size="md" mb={4}>Financeiro</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Receita Total</StatLabel>
                    <StatNumber color="green.600">
                      {formatCurrency(data.summary.financial.totalEarnings)}
                    </StatNumber>
                    <StatHelpText>
                      Média por viagem: {formatCurrency(data.summary.financial.avgTripValue)}
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Despesas</StatLabel>
                    <StatNumber color="red.600">
                      {formatCurrency(data.summary.financial.totalExpenses)}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Lucro Líquido</StatLabel>
                    <StatNumber color="blue.600">
                      {formatCurrency(data.summary.financial.netProfit)}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Margem</StatLabel>
                    <StatNumber color="purple.600">
                      {data.summary.financial.profitMargin.toFixed(1)}%
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>

          {/* KPIs Operacionais */}
          <Box>
            <Heading size="md" mb={4}>Operações</Heading>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Viagens</StatLabel>
                    <StatNumber>{data.summary.operations.totalTrips}</StatNumber>
                    <StatHelpText>
                      {data.summary.operations.avgTripsPerDay.toFixed(1)}/dia
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Distância</StatLabel>
                    <StatNumber>
                      {(data.summary.operations.totalDistance / 1000).toFixed(0)} km
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Horas</StatLabel>
                    <StatNumber>
                      {data.summary.operations.totalHours.toFixed(0)}h
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Taxa de Utilização</StatLabel>
                    <StatNumber>
                      {data.summary.fleet.utilizationRate.toFixed(0)}%
                    </StatNumber>
                    <StatHelpText>
                      {data.summary.fleet.activeVehicles} veículos
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>

          {/* Resumo Frota e Motoristas */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* Frota */}
            <Card>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Frota</Heading>
                  <FiTruck size={24} />
                </HStack>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text>Total de Veículos</Text>
                    <Badge colorScheme="blue" fontSize="md">
                      {data.summary.fleet.totalVehicles}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Ativos</Text>
                    <Badge colorScheme="green" fontSize="md">
                      {data.summary.fleet.activeVehicles}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Manutenção</Text>
                    <Badge colorScheme="yellow" fontSize="md">
                      {data.summary.fleet.maintenanceVehicles}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Inativos</Text>
                    <Badge colorScheme="gray" fontSize="md">
                      {data.summary.fleet.inactiveVehicles}
                    </Badge>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Motoristas */}
            <Card>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Motoristas</Heading>
                  <FiUsers size={24} />
                </HStack>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text>Total de Motoristas</Text>
                    <Badge colorScheme="blue" fontSize="md">
                      {data.summary.drivers.totalDrivers}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Ativos</Text>
                    <Badge colorScheme="green" fontSize="md">
                      {data.summary.drivers.activeDrivers}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Afiliados</Text>
                    <Badge colorScheme="purple" fontSize="md">
                      {data.summary.drivers.affiliates}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Locatários</Text>
                    <Badge colorScheme="orange" fontSize="md">
                      {data.summary.drivers.renters}
                    </Badge>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Top 5 Motoristas por Receita */}
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>Top 5 Motoristas por Receita</Heading>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Motorista</Th>
                    <Th>Tipo</Th>
                    <Th isNumeric>Receita</Th>
                    <Th isNumeric>Lucro</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.fleetRecords
                    .reduce((acc, record) => {
                      const existing = acc.find(r => r.driverId === record.driverId);
                      if (existing) {
                        existing.totalEarnings += record.totalEarnings;
                        existing.netProfit += record.netProfit;
                      } else {
                        acc.push({
                          driverId: record.driverId,
                          driverName: record.driverName,
                          totalEarnings: record.totalEarnings,
                          netProfit: record.netProfit,
                        });
                      }
                      return acc;
                    }, [] as any[])
                    .sort((a, b) => b.totalEarnings - a.totalEarnings)
                    .slice(0, 5)
                    .map((driver, idx) => {
                      const driverData = data.drivers.find(d => d.id === driver.driverId);
                      return (
                        <Tr key={driver.driverId}>
                          <Td fontWeight="medium">{driver.driverName}</Td>
                          <Td>
                            {driverData && (
                              <Badge colorScheme={driverData.type === 'affiliate' ? 'green' : 'blue'}>
                                {driverData.type}
                              </Badge>
                            )}
                          </Td>
                          <Td isNumeric color="green.600" fontWeight="medium">
                            {formatCurrency(driver.totalEarnings)}
                          </Td>
                          <Td isNumeric color="blue.600" fontWeight="medium">
                            {formatCurrency(driver.netProfit)}
                          </Td>
                        </Tr>
                      );
                    })}
                </Tbody>
              </Table>
            </CardBody>
          </Card>

          {/* Status das Integrações */}
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                Integrações ({data.summary.integrations.connected}/{data.summary.integrations.total})
              </Heading>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                {data.integrations.map(integration => (
                  <Box key={integration.id} textAlign="center">
                    <Text fontWeight="medium" mb={2}>{integration.name}</Text>
                    <Badge
                      colorScheme={
                        integration.status === 'connected' ? 'green' :
                        integration.status === 'error' ? 'red' : 'gray'
                      }
                      fontSize="sm"
                      px={3}
                      py={1}
                    >
                      {integration.status}
                    </Badge>
                  </Box>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </LoggedInLayout>
  );
}

// ========== SSR ==========
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);
  
  if ('redirect' in authResult || 'notFound' in authResult) {
    return authResult;
  }

  try {
    const { fetchDashboardData } = await import('@/lib/admin/unified-data');
    
    // Buscar dados unificados dos últimos 30 dias
    const initialData = await fetchDashboardData(30);

    return {
      props: {
        ...authResult.props,
        initialData,
      },
    };
  } catch (error) {
    console.error('Error fetching unified data:', error);
    throw error;
  }
};
