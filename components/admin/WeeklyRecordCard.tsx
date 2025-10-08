import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  ButtonGroup,
  Icon,
  Divider,
  Card,
  CardBody,
  Flex,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { FiFileText, FiCheckCircle, FiRotateCcw } from 'react-icons/fi';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';

interface DriverRecord extends DriverWeeklyRecord {
  driverType: 'affiliate' | 'renter';
  vehicle: string;
  platformData: WeeklyNormalizedData[];
}

interface WeeklyRecordCardProps {
  record: DriverRecord;
  formatCurrency: (value: number) => string;
  formatDateLabel: (value: string | undefined, locale: string) => string;
  typeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  statusColor: string;
  locale: string;
  onViewPayslip: (record: DriverRecord) => void;
  onTogglePaymentStatus: (record: DriverRecord) => void;
  onUpdateField: (recordId: string, field: string, value: number) => void;
  generatingRecordId: string | null;
  updatingPaymentId: string | null;
  tAdmin: (key: string, fallback?: string) => string;
}

const WeeklyRecordCard: React.FC<WeeklyRecordCardProps> = ({
  record,
  formatCurrency,
  formatDateLabel,
  typeLabels,
  statusLabels,
  statusColor,
  locale,
  onViewPayslip,
  onTogglePaymentStatus,
  onUpdateField,
  generatingRecordId,
  updatingPaymentId,
  tAdmin,
}) => {
  const isPaid = record.paymentStatus === 'paid';

  const platformValues = {
    uber: record.platformData
      .filter((p) => p.platform === 'uber')
      .reduce((acc, curr) => acc + (curr.totalValue || 0), 0),
    bolt: record.platformData
      .filter((p) => p.platform === 'bolt')
      .reduce((acc, curr) => acc + (curr.totalValue || 0), 0),
    prio: record.platformData
      .filter((p) => p.platform === 'myprio')
      .reduce((acc, curr) => acc + (curr.totalValue || 0), 0),
    viaverde: record.platformData
      .filter((p) => p.platform === 'viaverde')
      .reduce((acc, curr) => acc + (curr.totalValue || 0), 0),
  };

  return (
    <Card mb={4} shadow="md" borderWidth="1px">
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* Cabeçalho - Motorista e Status */}
          <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <Text fontWeight="bold" fontSize="lg">
                {record.driverName}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {record.vehicle}
              </Text>
              <Badge colorScheme={record.driverType === 'renter' ? 'purple' : 'green'} mt={1}>
                {typeLabels[record.driverType]}
              </Badge>
            </Box>
            <VStack align="flex-end" spacing={1}>
              <Badge colorScheme={statusColor} fontSize="sm">
                {statusLabels[record.paymentStatus] || record.paymentStatus}
              </Badge>
              {record.paymentDate && (
                <Text fontSize="xs" color="gray.500">
                  {formatDateLabel(record.paymentDate, locale)}
                </Text>
              )}
            </VStack>
          </Flex>

          <Divider />

          {/* Plataformas */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700">
              {tAdmin('weekly_records.sections.platforms', 'Plataformas')}
            </Text>
            <Grid templateColumns="repeat(2, 1fr)" gap={2}>
              <GridItem>
                <Text fontSize="xs" color="gray.600">Uber</Text>
                <Text fontSize="sm" fontWeight="medium">{formatCurrency(platformValues.uber)}</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.600">Bolt</Text>
                <Text fontSize="sm" fontWeight="medium">{formatCurrency(platformValues.bolt)}</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.600">PRIO</Text>
                <Text fontSize="sm" fontWeight="medium">{formatCurrency(platformValues.prio)}</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.600">ViaVerde</Text>
                <Text fontSize="sm" fontWeight="medium">{formatCurrency(platformValues.viaverde)}</Text>
              </GridItem>
            </Grid>
          </Box>

          <Divider />

          {/* Valores Financeiros */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700">
              {tAdmin('weekly_records.sections.financials', 'Valores Financeiros')}
            </Text>
            <VStack align="stretch" spacing={2}>
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {tAdmin('weekly_records.columns.grossTotal', 'Ganhos brutos')}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {formatCurrency(record.ganhosTotal)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {tAdmin('weekly_records.columns.iva', 'IVA')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="red.600">
                  -{formatCurrency(record.ivaValor)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {tAdmin('weekly_records.columns.adminExpenses', 'Taxa adm.')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="red.600">
                  -{formatCurrency(record.despesasAdm)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {tAdmin('weekly_records.columns.fuel', 'Combustível')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="orange.600">
                  -{formatCurrency(record.combustivel)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {tAdmin('weekly_records.columns.tolls', 'Portagens')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="orange.600">
                  -{formatCurrency(record.viaverde)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {tAdmin('weekly_records.columns.rent', 'Aluguel')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="purple.600">
                  -{formatCurrency(record.aluguel)}
                </Text>
              </Flex>
              <Divider />
              <Flex justify="space-between">
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                  {tAdmin('weekly_records.columns.net', 'Valor líquido')}
                </Text>
                <Text fontSize="md" fontWeight="bold" color="blue.600">
                  {formatCurrency(record.repasse)}
                </Text>
              </Flex>
            </VStack>
          </Box>

          <Divider />

          {/* Ações */}
          <VStack spacing={2} align="stretch">
            <Button
              leftIcon={<Icon as={FiFileText} />}
              onClick={() => onViewPayslip(record)}
              isLoading={generatingRecordId === record.id}
              loadingText={tAdmin("weekly_records.messages.generateInProgress", "A gerar...")}
              size="sm"
              colorScheme="blue"
              variant="outline"
              width="100%"
            >
              {tAdmin("weekly_records.actions.generatePayslip", "Contracheque")}
            </Button>
            <Button
              leftIcon={<Icon as={isPaid ? FiRotateCcw : FiCheckCircle} />}
              colorScheme={isPaid ? "yellow" : "green"}
              onClick={() => onTogglePaymentStatus(record)}
              isLoading={updatingPaymentId === record.id}
              size="sm"
              width="100%"
            >
              {isPaid
                ? tAdmin("weekly_records.actions.markAsPending", "Pendente")
                : tAdmin("weekly_records.actions.markAsPaid", "Pago")}
            </Button>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default WeeklyRecordCard;
