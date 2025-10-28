import { SimpleGrid, Card, CardBody, VStack, Heading, HStack, Text } from '@chakra-ui/react';

interface Stats {
  total: number;
  pending: number;
  paid: number;
  bonusCount: number;
  totalAmount: number;
  totalBonus: number;
}

interface WeeklySummaryStatsProps {
  stats?: Stats;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value || 0);
};

export default function WeeklySummaryStats({ stats }: WeeklySummaryStatsProps) {
  if (!stats) return null;

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
      <Card>
        <CardBody>
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" color="gray.600">
              Total
            </Text>
            <Heading size="lg">{stats.total}</Heading>
            <Text fontSize="xs" color="blue.600">
              {formatCurrency(stats.totalAmount)}
            </Text>
          </VStack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" color="gray.600">
              Pendentes
            </Text>
            <Heading size="lg" color="orange.600">
              {stats.pending}
            </Heading>
          </VStack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" color="gray.600">
              Pagos
            </Text>
            <Heading size="lg" color="green.600">
              {stats.paid}
            </Heading>
          </VStack>
        </CardBody>
      </Card>

      {stats.bonusCount > 0 && (
        <Card>
          <CardBody>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.600">
                Total Bônus
              </Text>
              <Heading size="lg" color="purple.600">
                {formatCurrency(stats.totalBonus)}
              </Heading>
              <Text fontSize="xs" color="purple.500">
                {stats.bonusCount} motoristas
              </Text>
            </VStack>
          </CardBody>
        </Card>
      )}
    </SimpleGrid>
  );
}
