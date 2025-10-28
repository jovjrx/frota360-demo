import { Card, CardBody, HStack, Select, HStack as StatsHStack, Badge, Box } from '@chakra-ui/react';

interface WeekOption {
  weekId: string;
  label: string;
}

interface Stats {
  total: number;
  pending: number;
  paid: number;
  bonusCount: number;
  totalAmount: number;
  totalBonus: number;
}

interface WeeklySelectorProps {
  selectedWeekId?: string;
  weeks: WeekOption[];
  onWeekChange: (weekId: string) => void;
  stats?: Stats;
}

export default function WeeklySelector({
  selectedWeekId,
  weeks,
  onWeekChange,
  stats,
}: WeeklySelectorProps) {
  return (
    <Card>
      <CardBody>
        <HStack spacing={4} align="center" justify="space-between" flexWrap="wrap">
          <Box flex={{ base: '1', md: '0 0 300px' }} minW={{ base: '150px', md: '300px' }}>
            <Select
              size="sm"
              value={selectedWeekId || ''}
              onChange={(e) => onWeekChange(e.target.value)}
              placeholder="Selecione uma semana..."
            >
              {weeks.map((week) => (
                <option key={week.weekId} value={week.weekId}>
                  {week.label}
                </option>
              ))}
            </Select>
          </Box>

          {stats && (
            <StatsHStack spacing={3} flexWrap="wrap">
              <Badge colorScheme="blue">Total: {stats.total}</Badge>
              <Badge colorScheme="orange">Pendentes: {stats.pending}</Badge>
              <Badge colorScheme="green">Pagos: {stats.paid}</Badge>
              {stats.bonusCount > 0 && <Badge colorScheme="purple">Bônus: {stats.bonusCount}</Badge>}
            </StatsHStack>
          )}
        </HStack>
      </CardBody>
    </Card>
  );
}
