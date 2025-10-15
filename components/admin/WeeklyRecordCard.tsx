import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Icon,
  Divider,
  Card,
  CardBody,
  Flex,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { FiFileText, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';
import { DriverPayment } from '@/schemas/driver-payment';

interface DriverRecord extends DriverWeeklyRecord {
  driverType: 'affiliate' | 'renter';
  vehicle: string;
  platformData: WeeklyNormalizedData[];
  paymentInfo?: DriverPayment | null;
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
  onInitiatePayment: (record: DriverRecord) => void;
  onUpdateField?: (recordId: string, updates: Partial<DriverWeeklyRecord>) => void;
  generatingRecordId: string | null;
  updatingPaymentId: string | null;
  t: (key: string, fallback?: string) => string;
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
  onInitiatePayment,
  onUpdateField,
  generatingRecordId,
  updatingPaymentId,
  t,
}) => {
  const isPaid = record.paymentStatus === 'paid';

  // Use valores diretamente do record (nova arquitetura)
  const uberTotal = record.uberTotal || 0;
  const boltTotal = record.boltTotal || 0;
  
    // Calcular valores de ônus bancário se existir
  const financingInstallment = record.financingDetails?.installment || 0;
  const financingInterest = record.financingDetails?.interestAmount || 0;
  const financingTotal = record.financingDetails?.totalCost || 0;

  const bankChargeBreakdownLabel = t(
    'weekly.control.records.labels.bankChargeBreakdown',
    'Parcela: {{installment}} | Ônus bancário: {{interest}}'
  )
    .replace('{{installment}}', formatCurrency(financingInstallment))
    .replace('{{interest}}', formatCurrency(financingInterest));

  return (
    <Card shadow="md" borderWidth="1px">
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
              {t('weekly.control.records.sections.platforms', 'Plataformas')}
            </Text>
            <Grid templateColumns="repeat(2, 1fr)" gap={2}>
              <GridItem>
                <Text fontSize="xs" color="gray.600">Uber</Text>
                <Text fontSize="sm" fontWeight="medium">{formatCurrency(uberTotal)}</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.600">Bolt</Text>
                <Text fontSize="sm" fontWeight="medium">{formatCurrency(boltTotal)}</Text>
              </GridItem>
            </Grid>
          </Box>

          <Divider />

          {/* Valores Financeiros */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700">
              {t('weekly.control.records.sections.financials', 'Valores Financeiros')}
            </Text>
            <VStack align="stretch" spacing={2}>
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {t('weekly.control.records.columns.grossTotal', 'Ganhos brutos')}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {formatCurrency(record.ganhosTotal)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {t('weekly.control.records.columns.iva', 'IVA')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="red.600">
                  -{formatCurrency(record.ivaValor)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {t('weekly.control.records.columns.adminExpenses', 'Taxa adm.')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="red.600">
                  -{formatCurrency(record.despesasAdm)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {t('weekly.control.records.columns.fuel', 'Combustível')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="orange.600">
                  -{formatCurrency(record.combustivel)}
                </Text>
              </Flex>
              <Flex justify="space-between" align="flex-start">
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    {t('weekly.control.records.columns.tolls', 'Portagens')}
                  </Text>
                  {record.viaverde > 0 && (
                    <Text fontSize="xs" color="gray.500">
                      {t('weekly.control.records.columns.tollsCompany', 'Pago pela empresa')}
                    </Text>
                  )}
                </Box>
                <Text fontSize="sm" fontWeight="medium" color="orange.600">
                  {formatCurrency(record.viaverde)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {t('weekly.control.records.columns.rent', 'Aluguel')}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="purple.600">
                  {record.aluguel > 0 ? `-${formatCurrency(record.aluguel)}` : '-'}
                </Text>
              </Flex>
              {financingTotal > 0 && (
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">
                      {t('weekly.control.records.columns.bankCharge', 'Financiamento')}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color="purple.600">
                    -{formatCurrency(financingTotal)}
                    <Text as="span" fontSize="xs" color="gray.500" ml={1}>
                      {bankChargeBreakdownLabel}
                    </Text>
                  </Text>
                </Flex>
              )}
              <Divider />
              <Flex justify="space-between">
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                  {t('weekly.control.records.columns.net', 'Valor líquido')}
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
              loadingText={t('weekly.control.records.messages.generateInProgress', 'A gerar...')}
              size="sm"
              colorScheme="blue"
              variant="outline"
              width="100%"
            >
              {t('weekly.control.records.actions.generatePayslip', 'Resumo')}
            </Button>
            {isPaid ? (
              <Button
                leftIcon={<Icon as={FiCheckCircle} />}
                colorScheme="green"
                size="sm"
                width="100%"
                isDisabled
              >
                {t('weekly.control.records.actions.alreadyPaid', 'Pago')}
              </Button>
            ) : (
              <Button
                leftIcon={<Icon as={FiCheckCircle} />}
                colorScheme="green"
                onClick={() => onInitiatePayment(record)}
                isLoading={updatingPaymentId === record.id}
                size="sm"
                width="100%"
              >
                {t('weekly.control.records.actions.markAsPaid', 'Pagar')}
              </Button>
            )}
          </VStack>

          {record.paymentInfo && (
            <>
              <Divider />
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={1} color="gray.700">
                  {t('weekly.control.records.paymentSummary.title', 'Pagamento')}
                </Text>
                <VStack align="stretch" spacing={1} fontSize="xs">
                  <Flex justify="space-between">
                    <Text color="gray.600">
                      {t('weekly.control.records.paymentSummary.base', 'Valor base')}
                    </Text>
                    <Text fontWeight="medium">
                      {formatCurrency(record.paymentInfo.baseAmount)}
                    </Text>
                  </Flex>
                  {record.paymentInfo.bonusCents > 0 && (
                    <Flex justify="space-between">
                      <Text color="green.600">
                        {t('weekly.control.records.paymentSummary.bonus', 'Bônus')}
                      </Text>
                      <Text fontWeight="medium" color="green.600">
                        +{formatCurrency(record.paymentInfo.bonusAmount)}
                      </Text>
                    </Flex>
                  )}
                  {record.paymentInfo.discountCents > 0 && (
                    <Flex justify="space-between">
                      <Text color="red.600">
                        {t('weekly.control.records.paymentSummary.discount', 'Desconto')}
                      </Text>
                      <Text fontWeight="medium" color="red.600">
                        -{formatCurrency(record.paymentInfo.discountAmount)}
                      </Text>
                    </Flex>
                  )}
                  <Flex justify="space-between" mt={1}>
                    <Text fontWeight="semibold" color="gray.700">
                      {t('weekly.control.records.paymentSummary.total', 'Valor pago')}
                    </Text>
                    <Text fontWeight="bold" color="green.600" fontSize="sm">
                      {formatCurrency(record.paymentInfo.totalAmount)}
                    </Text>
                  </Flex>
                  <Text color="gray.500">
                    {t('weekly.control.records.paymentSummary.paidAt', 'Pago em')}{' '}
                    {formatDateLabel(record.paymentInfo.paymentDate, locale)}
                  </Text>
                  {record.paymentInfo.notes && (
                    <Text color="gray.600">
                      {t('weekly.control.records.paymentSummary.notes', 'Observações')}: {record.paymentInfo.notes}
                    </Text>
                  )}
                  {record.paymentInfo.proofUrl && (
                    <Button
                      as="a"
                      href={record.paymentInfo.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="link"
                      size="xs"
                      colorScheme="blue"
                      leftIcon={<Icon as={FiExternalLink} />}
                      justifyContent="flex-start"
                      p={0}
                    >
                      {t('weekly.control.records.paymentSummary.proof', 'Ver comprovante')}
                    </Button>
                  )}
                </VStack>
              </Box>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default WeeklyRecordCard;
