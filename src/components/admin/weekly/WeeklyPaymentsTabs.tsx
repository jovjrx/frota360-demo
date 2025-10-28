import { useState } from 'react';
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  VStack,
  HStack,
  Button,
  Badge,
  Card,
  CardBody,
  Text,
  Box,
  Icon,
  ButtonGroup,
} from '@chakra-ui/react';
import { FiCheck, FiX } from 'react-icons/fi';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

interface WeeklyPaymentsTabsProps {
  records: DriverWeeklyRecord[];
  weekId?: string;
  onPay: () => Promise<void>;
  onRefresh: () => void;
  translations?: any;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value || 0);
};

export default function WeeklyPaymentsTabs({
  records,
  weekId,
  onPay,
  onRefresh,
  translations,
}: WeeklyPaymentsTabsProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [isPaying, setIsPaying] = useState(false);

  // Traduções com fallback para português
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations?.page || translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return typeof value === 'string' ? value : key;
  };

  const pendingRecords = records.filter((r) => r.paymentStatus === 'pending');
  const paidRecords = records.filter((r) => r.paymentStatus === 'paid');
  const bonusRecords = records.filter((r) => (r.totalBonusAmount || 0) > 0);

  const handlePay = async () => {
    setIsPaying(true);
    try {
      await onPay();
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Card>
      <CardBody p={0}>
        <Tabs index={tabIndex} onChange={setTabIndex} variant="soft-rounded" colorScheme="green" p={4}>
          <HStack justify="space-between" align="flex-start" mb={4}>
            <TabList>
              <Tab>
                {t('pending')} <Badge ml={2}>{pendingRecords.length}</Badge>
              </Tab>
              <Tab>
                {t('paid')} <Badge ml={2}>{paidRecords.length}</Badge>
              </Tab>
              {bonusRecords.length > 0 && (
                <Tab>
                  {t('bonus')} <Badge ml={2}>{bonusRecords.length}</Badge>
                </Tab>
              )}
            </TabList>

            <ButtonGroup size="sm" spacing={2}>
              <Button onClick={onRefresh} variant="outline">
                {t('refresh')}
              </Button>
              {tabIndex === 0 && pendingRecords.length > 0 && (
                <Button
                  colorScheme="green"
                  onClick={handlePay}
                  isLoading={isPaying}
                  leftIcon={<Icon as={FiCheck} />}
                >
                  {t('payAll')}
                </Button>
              )}
            </ButtonGroup>
          </HStack>

          <TabPanels>
            {/* PENDENTES */}
            <TabPanel px={0}>
              {pendingRecords.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={8}>
                  {t('noPendingPayments')}
                </Text>
              ) : (
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>{t('driver')}</Th>
                        <Th isNumeric>{t('baseValue')}</Th>
                        <Th isNumeric>{t('pendingBonus')}</Th>
                        <Th isNumeric>{t('total')}</Th>
                        <Th>{t('status')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pendingRecords.map((record) => (
                        <Tr key={record.id}>
                          <Td>{record.driverName || t('notAvailable') || 'N/A'}</Td>
                          <Td isNumeric>{formatCurrency(record.repasse || 0)}</Td>
                          <Td isNumeric color="purple.600">
                            {formatCurrency(
                              ((record.bonusMetaPending as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0) +
                                ((record.referralBonusPending as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0) +
                                (typeof record.commissionPending === 'number' ? record.commissionPending : 0)
                            )}
                          </Td>
                          <Td isNumeric fontWeight="bold">
                            {formatCurrency(
                              (record.repasse || 0) +
                                ((record.bonusMetaPending as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0) +
                                ((record.referralBonusPending as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0) +
                                (typeof record.commissionPending === 'number' ? record.commissionPending : 0)
                            )}
                          </Td>
                          <Td>
                            <Badge colorScheme="orange">Pendente</Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </TabPanel>

            {/* PAGOS */}
            <TabPanel px={0}>
              {paidRecords.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={8}>
                  {t('noCompletedPayments')}
                </Text>
              ) : (
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>{t('driver')}</Th>
                        <Th isNumeric>{t('baseValue')}</Th>
                        <Th isNumeric>{t('paidBonus')}</Th>
                        <Th isNumeric>{t('total')}</Th>
                        <Th>{t('date')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {paidRecords.map((record) => (
                        <Tr key={record.id}>
                          <Td>{record.driverName || t('notAvailable') || 'N/A'}</Td>
                          <Td isNumeric>{formatCurrency(record.repasse || 0)}</Td>
                          <Td isNumeric color="green.600">
                            {formatCurrency(
                              ((record.bonusMetaPaid as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0) +
                                ((record.referralBonusPaid as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0) +
                                (typeof record.commissionPaid === 'number' ? record.commissionPaid : 0)
                            )}
                          </Td>
                          <Td isNumeric fontWeight="bold">
                            {formatCurrency(
                              (record.repasse || 0) +
                                ((record.bonusMetaPaid as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0) +
                                ((record.referralBonusPaid as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0) +
                                (typeof record.commissionPaid === 'number' ? record.commissionPaid : 0)
                            )}
                          </Td>
                          <Td>
                            <Text fontSize="sm" color="gray.600">
                              {record.paymentDate
                                ? new Intl.DateTimeFormat('pt-PT').format(new Date(record.paymentDate))
                                : t('notAvailable') || '—'}
                            </Text>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </TabPanel>

            {/* BÔNUS */}
            {bonusRecords.length > 0 && (
              <TabPanel px={0}>
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>{t('driver')}</Th>
                        <Th isNumeric>{t('bonusMeta')}</Th>
                        <Th isNumeric>{t('referralBonus')}</Th>
                        <Th isNumeric>{t('commission')}</Th>
                        <Th isNumeric>{t('totalBonus')}</Th>
                        <Th>{t('status')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {bonusRecords.map((record) => {
                        const bonusMetaAmount = (record.bonusMetaPending as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0;
                        const referralBonusAmount = (record.referralBonusPending as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0;
                        const commissionAmount = typeof record.commissionPending === 'number' ? record.commissionPending : 0;
                        const bonusMetaPaidAmount = (record.bonusMetaPaid as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0;
                        const referralBonusPaidAmount = (record.referralBonusPaid as any)?.reduce?.((s: number, b: any) => s + (b.amount || 0), 0) || 0;
                        const commissionPaidAmount = typeof record.commissionPaid === 'number' ? record.commissionPaid : 0;
                        const isPaid = record.paymentStatus === 'paid';

                        return (
                          <Tr key={record.id}>
                            <Td>{record.driverName || t('notAvailable') || 'N/A'}</Td>
                            <Td isNumeric color={isPaid ? 'green.600' : 'orange.600'}>
                              {formatCurrency(isPaid ? bonusMetaPaidAmount : bonusMetaAmount)}
                            </Td>
                            <Td isNumeric color={isPaid ? 'green.600' : 'orange.600'}>
                              {formatCurrency(isPaid ? referralBonusPaidAmount : referralBonusAmount)}
                            </Td>
                            <Td isNumeric color={isPaid ? 'green.600' : 'orange.600'}>
                              {formatCurrency(isPaid ? commissionPaidAmount : commissionAmount)}
                            </Td>
                            <Td isNumeric fontWeight="bold" color={isPaid ? 'green.600' : 'purple.600'}>
                              {formatCurrency(
                                isPaid
                                  ? (bonusMetaPaidAmount + referralBonusPaidAmount + commissionPaidAmount)
                                  : (bonusMetaAmount + referralBonusAmount + commissionAmount)
                              )}
                            </Td>
                            <Td>
                              <Badge colorScheme={isPaid ? 'green' : 'orange'}>
                                {isPaid ? 'Pago' : 'Pendente'}
                              </Badge>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </CardBody>
    </Card>
  );
}
