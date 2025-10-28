import React from 'react';
import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
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
import {
  FiTrendingUp,
  FiDollarSign,
  FiTruck,
  FiBarChart2,
} from 'react-icons/fi';
import { PerformanceMetrics } from '@/lib/performance/metrics';

const COLORS = {
  earnings: '#10B981',
  adminFee: '#EF4444',
  fuel: '#F59E0B',
  tolls: '#8B5CF6',
  rental: '#EC4899',
  financing: '#F97316',
  repasse: '#06B6D4',
};

interface DriverPerformanceChartsProps {
  metrics: PerformanceMetrics | null;
  isLoading?: boolean;
}

export function DriverPerformanceCharts({
  metrics,
  isLoading = false,
}: DriverPerformanceChartsProps) {
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
    earnings: Math.round(w.totalEarnings * 100) / 100,
    repasse: Math.round(w.netPayout * 100) / 100,
    trips: w.trips,
  }));

  // Dados para decontos por semana
  const deductionsWeekly = metrics.weeklyData.map(w => ({
    week: new Date(w.weekStart).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' }),
    'Taxa Adm': Math.round(w.adminFee * 100) / 100,
    'Combustível': Math.round(w.fuelCost * 100) / 100,
    'Portagens': Math.round(w.tollsCost * 100) / 100,
    'Aluguel': Math.round(w.rentalCost * 100) / 100,
  }));

  // Dados para pie de descontos totais
  const deductionsData = [
    { name: 'Taxa Adm', value: metrics.adminFee.total },
    { name: 'Combustível', value: metrics.fuel.total },
    { name: 'Portagens', value: metrics.tolls.total },
    { name: 'Aluguel', value: metrics.rental.total },
    { name: 'Financiamento', value: metrics.financing.total },
  ].filter(d => d.value > 0);

  return (
    <VStack spacing={6} w="full" align="stretch">
      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm">Ganhos Totais</StatLabel>
              <StatNumber fontSize="2xl">€{metrics.earnings.total.toFixed(2)}</StatNumber>
              <StatHelpText>
                <StatArrow type={metrics.earnings.trend >= 0 ? 'increase' : 'decrease'} />
                {Math.abs(metrics.earnings.trend).toFixed(1)}%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm">Seu Repasse</StatLabel>
              <StatNumber fontSize="2xl" color="green.600">
                €{metrics.totalNetPayout.toFixed(2)}
              </StatNumber>
              <StatHelpText>
                {((metrics.totalNetPayout / metrics.totalEarnings) * 100).toFixed(1)}% do bruto
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm">Média/Semana</StatLabel>
              <StatNumber fontSize="2xl">€{metrics.earnings.avg.toFixed(2)}</StatNumber>
              <StatHelpText>
                Melhor: €{metrics.earnings.max.toFixed(2)}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm">Total de Viagens</StatLabel>
              <StatNumber fontSize="2xl">{metrics.totalTrips}</StatNumber>
              <StatHelpText>
                €{metrics.efficiency.avgEarningsPerTrip.toFixed(2)}/viagem
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Gráfico Principal: Ganhos vs Repasse */}
      <Card>
        <CardBody>
          <Text fontWeight="bold" mb={4} fontSize="lg">
            📈 Seu Desempenho Semanal
          </Text>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="week" 
                angle={-45} 
                textAnchor="end" 
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => typeof value === 'number' ? `€${value.toFixed(2)}` : value}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="earnings" 
                fill={COLORS.earnings} 
                name="Ganhos Brutos"
                opacity={0.8}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="repasse"
                stroke={COLORS.repasse}
                name="Seu Repasse"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Grid: Descontos e Eficiência */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {/* Composição de Descontos */}
        <Card>
          <CardBody>
            <Text fontWeight="bold" mb={4}>
              💰 Seus Descontos
            </Text>
            {deductionsData.length > 0 ? (
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
                      <Cell 
                        key={`cell-${index}`} 
                        fill={Object.values(COLORS)[index % Object.values(COLORS).length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `€${typeof value === 'number' ? value.toFixed(2) : value}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text color="gray.500" textAlign="center" py={10}>
                Sem descontos registrados
              </Text>
            )}
            <VStack align="start" spacing={2} mt={4} fontSize="sm">
              {deductionsData.map((item, idx) => (
                <HStack key={idx} justify="space-between" w="full">
                  <HStack>
                    <Box 
                      w={3} 
                      h={3} 
                      bg={Object.values(COLORS)[idx % Object.values(COLORS).length]} 
                      borderRadius="sm" 
                    />
                    <Text>{item.name}</Text>
                  </HStack>
                  <Text fontWeight="bold">
                    €{item.value.toFixed(2)}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>

        {/* Descontos Semanal */}
        <Card>
          <CardBody>
            <Text fontWeight="bold" mb={4}>
              📊 Descontos por Semana
            </Text>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deductionsWeekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="week" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => `€${typeof value === 'number' ? value.toFixed(2) : value}`} />
                <Legend />
                <Bar dataKey="Taxa Adm" stackId="a" fill={COLORS.adminFee} />
                <Bar dataKey="Combustível" stackId="a" fill={COLORS.fuel} />
                <Bar dataKey="Portagens" stackId="a" fill={COLORS.tolls} />
                <Bar dataKey="Aluguel" stackId="a" fill={COLORS.rental} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Eficiência */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card bg="green.50" borderWidth="2px" borderColor="green.200">
          <CardBody>
            <VStack align="start" spacing={3}>
              <HStack>
                <Icon as={FiDollarSign} color="green.600" boxSize={6} />
                <Text fontSize="sm" fontWeight="bold" color="green.700">
                  Ganho Médio por Viagem
                </Text>
              </HStack>
              <Text fontWeight="bold" fontSize="xl" color="green.700">
                €{metrics.efficiency.avgEarningsPerTrip.toFixed(2)}
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card bg="blue.50" borderWidth="2px" borderColor="blue.200">
          <CardBody>
            <VStack align="start" spacing={3}>
              <HStack>
                <Icon as={FiTruck} color="blue.600" boxSize={6} />
                <Text fontSize="sm" fontWeight="bold" color="blue.700">
                  Viagens/Semana
                </Text>
              </HStack>
              <Text fontWeight="bold" fontSize="xl" color="blue.700">
                {Math.round(metrics.efficiency.avgTripsPerWeek)}
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card bg="purple.50" borderWidth="2px" borderColor="purple.200">
          <CardBody>
            <VStack align="start" spacing={3}>
              <HStack>
                <Icon as={FiBarChart2} color="purple.600" boxSize={6} />
                <Text fontSize="sm" fontWeight="bold" color="purple.700">
                  Taxa Adm % do Ganho
                </Text>
              </HStack>
              <Text fontWeight="bold" fontSize="xl" color="purple.700">
                {metrics.adminFee.percentage.toFixed(1)}%
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Período coberto */}
      <Card bg="gray.50">
        <CardBody>
          <HStack justify="space-between" fontSize="sm" color="gray.600">
            <Text>
              <strong>{metrics.totalWeeks}</strong> semana{metrics.totalWeeks !== 1 ? 's' : ''} analisada{metrics.totalWeeks !== 1 ? 's' : ''}
            </Text>
            <Text>
              De {new Date(metrics.startDate).toLocaleDateString('pt-PT')} até {new Date(metrics.endDate).toLocaleDateString('pt-PT')}
            </Text>
          </HStack>
        </CardBody>
      </Card>
    </VStack>
  );
}

