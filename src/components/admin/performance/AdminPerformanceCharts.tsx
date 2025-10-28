import React, { useMemo } from 'react';
import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  Skeleton,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiTruck } from 'react-icons/fi';
import { PerformanceMetrics, WeeklyMetrics } from '@/lib/performance/metrics';

const COLORS = {
  earnings: '#10B981',
  adminFee: '#EF4444',
  fuel: '#F59E0B',
  tolls: '#8B5CF6',
  rental: '#EC4899',
  financing: '#F97316',
  uber: '#000000',
  bolt: '#1E40AF',
  repasse: '#06B6D4',
};

interface AdminPerformanceChartsProps {
  metrics: PerformanceMetrics | null;
  isLoading?: boolean;
}

export function AdminPerformanceCharts({
  metrics,
  isLoading = false,
}: AdminPerformanceChartsProps) {
  if (isLoading) {
    return (
      <VStack spacing={4} w="full">
        <Skeleton height="300px" w="full" />
        <Skeleton height="300px" w="full" />
      </VStack>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardBody>
          <Text color="gray.500">Nenhum dado de performance disponível</Text>
        </CardBody>
      </Card>
    );
  }

  // Dados para gráfico de linha (semanal)
  const weeklyChartData = metrics.weeklyData.map(w => ({
    week: new Date(w.weekStart).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' }),
    weekStart: w.weekStart,
    earnings: Math.round(w.totalEarnings * 100) / 100,
    repasse: Math.round(w.netPayout * 100) / 100,
    adminFee: Math.round(w.adminFee * 100) / 100,
    fuel: Math.round(w.fuelCost * 100) / 100,
  }));

  // Dados para gráfico de decontos (pie)
  const deductionsData = [
    { name: 'Taxa Adm', value: metrics.adminFee.total },
    { name: 'Combustível', value: metrics.fuel.total },
    { name: 'Portagens', value: metrics.tolls.total },
    { name: 'Aluguel', value: metrics.rental.total },
    { name: 'Financiamento', value: metrics.financing.total },
  ].filter(d => d.value > 0);

  // Dados para gráfico de plataformas
  const platformsData = [
    { name: 'Uber', value: metrics.platforms.uber.total },
    { name: 'Bolt', value: metrics.platforms.bolt.total },
  ].filter(d => d.value > 0);

  // Dados para comparativo (stack bar)
  const comparisonData = metrics.weeklyData.map(w => ({
    week: new Date(w.weekStart).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' }),
    'Taxa Adm': Math.round(w.adminFee * 100) / 100,
    'Combustível': Math.round(w.fuelCost * 100) / 100,
    'Portagens': Math.round(w.tollsCost * 100) / 100,
    'Aluguel': Math.round(w.rentalCost * 100) / 100,
    'Financiamento': Math.round(w.financingCost * 100) / 100,
  }));

  return (
    <VStack spacing={6} w="full" align="stretch">
      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total de Ganhos</StatLabel>
              <StatNumber>€{metrics.earnings.total.toFixed(2)}</StatNumber>
              <StatHelpText>
                <StatArrow type={metrics.earnings.trend >= 0 ? 'increase' : 'decrease'} />
                {Math.abs(metrics.earnings.trend).toFixed(1)}% vs média anterior
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Repasse Total</StatLabel>
              <StatNumber color="green.600">€{metrics.totalNetPayout.toFixed(2)}</StatNumber>
              <StatHelpText>
                {((metrics.totalNetPayout / metrics.totalEarnings) * 100).toFixed(1)}% do total
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Média / Semana</StatLabel>
              <StatNumber>€{metrics.earnings.avg.toFixed(2)}</StatNumber>
              <StatHelpText>
                Min: €{metrics.earnings.min.toFixed(2)} | Max: €{metrics.earnings.max.toFixed(2)}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Trips Total</StatLabel>
              <StatNumber>{metrics.totalTrips}</StatNumber>
              <StatHelpText>
                €{metrics.efficiency.avgEarningsPerTrip.toFixed(2)} / trip
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Gráfico de Ganhos Semanal */}
      <Card>
        <CardBody>
          <Text fontWeight="bold" mb={4}>
            📈 Evolução Semanal: Ganhos vs Repasse
          </Text>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value: any) => `€${typeof value === 'number' ? value.toFixed(2) : value}`} />
              <Legend />
              <Bar dataKey="earnings" fill={COLORS.earnings} name="Ganhos Brutos" />
              <Line
                type="monotone"
                dataKey="repasse"
                stroke={COLORS.repasse}
                name="Repasse"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Gráficos em Grid */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {/* Distribuição de Descontos (Pie) */}
        <Card>
          <CardBody>
            <Text fontWeight="bold" mb={4}>
              💰 Distribuição de Descontos
            </Text>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deductionsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deductionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % 5]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `€${typeof value === 'number' ? value.toFixed(2) : value}`} />
              </PieChart>
            </ResponsiveContainer>
            <VStack align="start" spacing={2} mt={4} fontSize="sm">
              {deductionsData.map((item, idx) => (
                <HStack key={idx}>
                  <Box w={3} h={3} bg={Object.values(COLORS)[idx % 5]} borderRadius="sm" />
                  <Text>
                    {item.name}: €{item.value.toFixed(2)} ({((item.value / metrics.totalDeductions) * 100).toFixed(1)}%)
                  </Text>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>

        {/* Uber vs Bolt */}
        <Card>
          <CardBody>
            <Text fontWeight="bold" mb={4}>
              🚗 Plataformas
            </Text>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={platformsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[5 + index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `€${typeof value === 'number' ? value.toFixed(2) : value}`} />
              </PieChart>
            </ResponsiveContainer>
            <VStack align="start" spacing={2} mt={4} fontSize="sm">
              {platformsData.map((item, idx) => (
                <HStack key={idx}>
                  <Box w={3} h={3} bg={Object.values(COLORS)[5 + idx]} borderRadius="sm" />
                  <Text>
                    {item.name}: €{item.value.toFixed(2)} ({((item.value / metrics.totalEarnings) * 100).toFixed(1)}%)
                  </Text>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Descontos Stackados */}
      <Card>
        <CardBody>
          <Text fontWeight="bold" mb={4}>
            📊 Descontos Semanais (Stackados)
          </Text>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value: any) => `€${typeof value === 'number' ? value.toFixed(2) : value}`} />
              <Legend />
              <Bar dataKey="Taxa Adm" stackId="a" fill={COLORS.adminFee} />
              <Bar dataKey="Combustível" stackId="a" fill={COLORS.fuel} />
              <Bar dataKey="Portagens" stackId="a" fill={COLORS.tolls} />
              <Bar dataKey="Aluguel" stackId="a" fill={COLORS.rental} />
              <Bar dataKey="Financiamento" stackId="a" fill={COLORS.financing} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Estatísticas de Eficiência */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card>
          <CardBody>
            <VStack align="start" spacing={2}>
              <HStack>
                <Icon as={FiDollarSign} color="green.500" boxSize={5} />
                <Text fontSize="sm" color="gray.600">
                  Ganho Médio/Trip
                </Text>
              </HStack>
              <Text fontWeight="bold" fontSize="lg">
                €{metrics.efficiency.avgEarningsPerTrip.toFixed(2)}
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack align="start" spacing={2}>
              <HStack>
                <Icon as={FiTruck} color="blue.500" boxSize={5} />
                <Text fontSize="sm" color="gray.600">
                  Trips/Semana
                </Text>
              </HStack>
              <Text fontWeight="bold" fontSize="lg">
                {Math.round(metrics.efficiency.avgTripsPerWeek)}
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack align="start" spacing={2}>
              <HStack>
                <Icon as={FiTrendingUp} color="purple.500" boxSize={5} />
                <Text fontSize="sm" color="gray.600">
                  Taxa Adm % Ganhos
                </Text>
              </HStack>
              <Text fontWeight="bold" fontSize="lg">
                {metrics.adminFee.percentage.toFixed(1)}%
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </VStack>
  );
}

