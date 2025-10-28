import React, { useMemo } from 'react';
import {
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Tab,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  Badge,
  HStack,
  Button,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { FiEye, FiCheckCircle } from 'react-icons/fi';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

interface WeeklyTablesProps {
  records: DriverWeeklyRecord[];
  onBonusReview: (record: DriverWeeklyRecord) => void;
  onPayment: (record: DriverWeeklyRecord) => void;
  isLoading?: boolean;
}

export default function WeeklyTables({
  records,
  onBonusReview,
  onPayment,
  isLoading = false,
}: WeeklyTablesProps) {
  // Separate records by status
  const pendingRecords = useMemo(
    () => records.filter((r) => r.paymentStatus === 'pending'),
    [records]
  );

  const bonusRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          (r.bonusMetaPending?.length || 0) +
            (r.referralBonusPending?.length || 0) >
          0
      ),
    [records]
  );

  const paidRecords = useMemo(
    () => records.filter((r) => r.paymentStatus === 'paid'),
    [records]
  );

  return (
    <Tabs>
      <TabList>
        <Tab>
          Motoristas Pendentes ({pendingRecords.length})
        </Tab>
        <Tab>
          Com Bonus ({bonusRecords.length})
        </Tab>
        <Tab>
          Pagos ({paidRecords.length})
        </Tab>
      </TabList>

      <TabPanels>
        {/* PENDING PAYMENTS TAB */}
        <TabPanel>
          {pendingRecords.length > 0 ? (
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr bg="gray.100">
                    <Th>Motorista</Th>
                    <Th isNumeric>Ganhos</Th>
                    <Th isNumeric>Taxa Adm</Th>
                    <Th isNumeric>Bonus</Th>
                    <Th isNumeric>Repasse</Th>
                    <Th w="120px">Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {pendingRecords.map((record) => (
                    <Tr key={record.id} _hover={{ bg: 'gray.50' }}>
                      <Td fontWeight="bold" color="gray.900">
                        {record.driverName}
                      </Td>
                      <Td isNumeric>€{(record.ganhosTotal || 0).toFixed(2)}</Td>
                      <Td isNumeric color="red.600">
                        -€{(record.despesasAdm || 0).toFixed(2)}
                      </Td>
                      <Td isNumeric>
                        {(record.totalBonusAmount || 0) > 0 ? (
                          <Badge colorScheme="purple">
                            €{(record.totalBonusAmount || 0).toFixed(2)}
                          </Badge>
                        ) : (
                          <Badge colorScheme="gray">€0.00</Badge>
                        )}
                      </Td>
                      <Td isNumeric fontWeight="bold" fontSize="md" color="green.600">
                        €{(record.repasse || 0).toFixed(2)}
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          {(record.totalBonusAmount || 0) > 0 && (
                            <Tooltip label="Ver bonus">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => onBonusReview(record)}
                                isDisabled={isLoading}
                              >
                                <Icon as={FiEye} fontSize="16px" />
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip label="Marcar como pago">
                            <Button
                              size="xs"
                              colorScheme="green"
                              onClick={() => onPayment(record)}
                              isDisabled={isLoading}
                            >
                              <Icon as={FiCheckCircle} fontSize="16px" />
                            </Button>
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              Nenhum pagamento pendente
            </Alert>
          )}
        </TabPanel>

        {/* BONUS TAB */}
        <TabPanel>
          {bonusRecords.length > 0 ? (
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr bg="gray.100">
                    <Th>Motorista</Th>
                    <Th>Tipo Bonus</Th>
                    <Th isNumeric>Montante</Th>
                    <Th>Descrição</Th>
                    <Th w="60px">Ação</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {bonusRecords.map((record) => (
                    <React.Fragment key={record.id}>
                      {/* Bonus Meta */}
                      {record.bonusMetaPending?.map((bonus, idx) => (
                        <Tr key={`${record.id}-meta-${idx}`} _hover={{ bg: 'yellow.50' }}>
                          <Td fontWeight="bold">{record.driverName}</Td>
                          <Td>
                            <Badge colorScheme="yellow">Bonus Meta</Badge>
                          </Td>
                          <Td isNumeric fontWeight="bold" color="yellow.700">
                            €{bonus.amount.toFixed(2)}
                          </Td>
                          <Td fontSize="xs" color="gray.600">
                            {bonus.description}
                          </Td>
                          <Td textAlign="center">
                            <Tooltip label="Detalhes">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => onBonusReview(record)}
                              >
                                <Icon as={FiEye} />
                              </Button>
                            </Tooltip>
                          </Td>
                        </Tr>
                      ))}

                      {/* Bonus Referral */}
                      {record.referralBonusPending?.map((bonus, idx) => (
                        <Tr key={`${record.id}-ref-${idx}`} _hover={{ bg: 'purple.50' }}>
                          <Td fontWeight="bold">{record.driverName}</Td>
                          <Td>
                            <Badge colorScheme="purple">Bonus Indicação</Badge>
                          </Td>
                          <Td isNumeric fontWeight="bold" color="purple.700">
                            €{bonus.amount.toFixed(2)}
                          </Td>
                          <Td fontSize="xs" color="gray.600">
                            Indicado: {bonus.referredDriverName}
                          </Td>
                          <Td textAlign="center">
                            <Tooltip label="Detalhes">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => onBonusReview(record)}
                              >
                                <Icon as={FiEye} />
                              </Button>
                            </Tooltip>
                          </Td>
                        </Tr>
                      ))}

                      {/* Commission */}
                      {record.commissionPending && (
                        <Tr _hover={{ bg: 'blue.50' }}>
                          <Td fontWeight="bold">{record.driverName}</Td>
                          <Td>
                            <Badge colorScheme="blue">Comissão</Badge>
                          </Td>
                          <Td isNumeric fontWeight="bold" color="blue.700">
                            €{((record.commissionPending as any).amount).toFixed(2)}
                          </Td>
                          <Td fontSize="xs" color="gray.600">
                            {((record.commissionPending as any).subordinatesCount)} motoristas
                          </Td>
                          <Td textAlign="center">
                            <Tooltip label="Detalhes">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => onBonusReview(record)}
                              >
                                <Icon as={FiEye} />
                              </Button>
                            </Tooltip>
                          </Td>
                        </Tr>
                      )}
                    </React.Fragment>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              Nenhum bonus registrado
            </Alert>
          )}
        </TabPanel>

        {/* PAID TAB */}
        <TabPanel>
          {paidRecords.length > 0 ? (
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr bg="gray.100">
                    <Th>Motorista</Th>
                    <Th>Data Pagamento</Th>
                    <Th isNumeric>Montante</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paidRecords.map((record) => (
                    <Tr key={record.id} _hover={{ bg: 'green.50' }}>
                      <Td fontWeight="bold">{record.driverName}</Td>
                      <Td>{record.paymentDate || '-'}</Td>
                      <Td isNumeric fontWeight="bold" fontSize="md" color="green.600">
                        €{(record.repasse || 0).toFixed(2)}
                      </Td>
                      <Td>
                        <Badge colorScheme="green">✅ Pago</Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              Nenhum pagamento concluído
            </Alert>
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
