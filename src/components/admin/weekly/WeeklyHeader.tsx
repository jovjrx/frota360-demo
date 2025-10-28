import React from 'react';
import {
  Box,
  Card,
  CardBody,
  HStack,
  VStack,
  Text,
  Select,
  Badge,
  SimpleGrid,
  Button,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { FiRefreshCw, FiPlayCircle, FiDollarSign, FiEye } from 'react-icons/fi';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

export interface PaymentStats {
  total: number;
  processed: number;
  pending: number;
  paid: number;
  totalAmount: number;
  totalBonus: number;
}

export type PageStatus = 'import' | 'process' | 'review' | 'payment' | 'completed';

interface WeeklyHeaderProps {
  weeks: Array<{ weekId: string; label: string }>;
  selectedWeek: string;
  onWeekChange: (weekId: string) => void;
  stats: PaymentStats;
  pageStatus: PageStatus;
  onRefresh: () => void;
  onProcess: () => void;
  onReviewBonus: () => void;
  onPayment: () => void;
  isLoading?: boolean;
  recordsWithBonus?: number;
}

export default function WeeklyHeader({
  weeks,
  selectedWeek,
  onWeekChange,
  stats,
  pageStatus,
  onRefresh,
  onProcess,
  onReviewBonus,
  onPayment,
  isLoading = false,
  recordsWithBonus = 0,
}: WeeklyHeaderProps) {
  const getStatusColor = (status: PageStatus) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'payment':
        return 'blue';
      case 'review':
        return 'orange';
      case 'process':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: PageStatus) => {
    switch (status) {
      case 'completed':
        return '✅ Concluído';
      case 'payment':
        return '💳 Pagamento';
      case 'review':
        return '👀 Revisão';
      case 'process':
        return '⚙️ Processamento';
      default:
        return '📥 Importação';
    }
  };

  return (
    <Card bg="blue.50" borderColor="blue.200">
      <CardBody>
        {/* Week Selection and Status */}
        <HStack justify="space-between" mb={6} align="flex-start">
          <VStack align="start" spacing={2}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.600">
              Semana Selecionada
            </Text>
            <Select
              value={selectedWeek}
              onChange={(e) => onWeekChange(e.target.value)}
              w="250px"
              fontWeight="semibold"
            >
              {weeks.map((w) => (
                <option key={w.weekId} value={w.weekId}>
                  {w.label}
                </option>
              ))}
            </Select>
          </VStack>

          <VStack align="end" spacing={2}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.600">
              Status
            </Text>
            <Badge
              fontSize="md"
              px={4}
              py={2}
              colorScheme={getStatusColor(pageStatus)}
              borderRadius="md"
            >
              {getStatusLabel(pageStatus)}
            </Badge>
          </VStack>
        </HStack>

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 2, md: 6 }} spacing={4} mb={6}>
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1} fontWeight="semibold">
              Total Motoristas
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {stats.total}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1} fontWeight="semibold">
              Processados
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {stats.processed}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1} fontWeight="semibold">
              Pendentes
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="orange.600">
              {stats.pending}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1} fontWeight="semibold">
              Pagos
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.700">
              {stats.paid}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1} fontWeight="semibold">
              Total Repasse
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              €{stats.totalAmount.toFixed(2)}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1} fontWeight="semibold">
              Total Bonus
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="purple.600">
              €{stats.totalBonus.toFixed(2)}
            </Text>
          </Box>
        </SimpleGrid>

        {/* Action Buttons */}
        <HStack spacing={3} flexWrap="wrap">
          <Tooltip label="Atualizar dados">
            <Button
              leftIcon={<Icon as={FiRefreshCw} />}
              onClick={onRefresh}
              isLoading={isLoading}
              size="sm"
            >
              Atualizar
            </Button>
          </Tooltip>

          {pageStatus === 'import' && (
            <Tooltip label="Iniciar processamento da semana">
              <Button
                leftIcon={<Icon as={FiPlayCircle} />}
                colorScheme="blue"
                onClick={onProcess}
                isLoading={isLoading}
                size="sm"
              >
                Processar Semana
              </Button>
            </Tooltip>
          )}

          {pageStatus === 'review' && (
            <>
              <Tooltip label={`Revisar ${recordsWithBonus} motoristas com bonus`}>
                <Button
                  leftIcon={<Icon as={FiEye} />}
                  colorScheme="orange"
                  onClick={onReviewBonus}
                  size="sm"
                >
                  Revisar Bonus ({recordsWithBonus})
                </Button>
              </Tooltip>

              <Tooltip label="Iniciar pagamentos">
                <Button
                  leftIcon={<Icon as={FiDollarSign} />}
                  colorScheme="green"
                  onClick={onPayment}
                  size="sm"
                >
                  Confirmar Pagamentos
                </Button>
              </Tooltip>
            </>
          )}
        </HStack>
      </CardBody>
    </Card>
  );
}
