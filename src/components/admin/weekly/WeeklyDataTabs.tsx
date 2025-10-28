import { Tabs, TabList, TabPanels, Tab, TabPanel, Table, Thead, Tbody, Tr, Th, Td, Box, Badge, HStack } from '@chakra-ui/react';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

interface WeeklyDataRecord {
  id: string;
  weekId: string;
  driverName: string;
  platform: string;
  status?: string;
  paymentStatus?: string;
  repasse?: number;
  totalBonusAmount?: number;
  createdAt?: string;
  [key: string]: any;
}

interface WeeklyDataTabsProps {
  rawData?: WeeklyDataRecord[];
  processedData?: DriverWeeklyRecord[];
  isLoading?: boolean;
}

export default function WeeklyDataTabs({ rawData = [], processedData = [], isLoading = false }: WeeklyDataTabsProps) {
  return (
    <Tabs variant="soft-rounded" colorScheme="blue">
      <TabList mb="1em">
        <Tab>Dados Brutos ({rawData.length})</Tab>
        <Tab>Dados Processados ({processedData.length})</Tab>
      </TabList>

      <TabPanels>
        {/* RAW DATA TAB */}
        <TabPanel>
          <Box overflowX="auto">
            <Table size="sm">
              <Thead bg="gray.100">
                <Tr>
                  <Th>Driver</Th>
                  <Th>Plataforma</Th>
                  <Th isNumeric>Valor</Th>
                  <Th>Status</Th>
                  <Th>Data</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rawData.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center" py={4}>
                      {isLoading ? 'Carregando...' : 'Nenhum dado disponível'}
                    </Td>
                  </Tr>
                ) : (
                  rawData.map((record) => (
                    <Tr key={record.id} _hover={{ bg: 'gray.50' }}>
                      <Td fontWeight="500">{record.driverName}</Td>
                      <Td>
                        <Badge colorScheme="purple" variant="subtle">
                          {record.platform}
                        </Badge>
                      </Td>
                      <Td isNumeric fontWeight="bold">
                        €{(record.repasse || 0).toFixed(2)}
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={record.status === 'processed' ? 'green' : 'yellow'}
                          variant="subtle"
                        >
                          {record.status || 'raw'}
                        </Badge>
                      </Td>
                      <Td fontSize="xs" color="gray.600">
                        {record.createdAt
                          ? new Date(record.createdAt).toLocaleDateString('pt-PT')
                          : '-'}
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </TabPanel>

        {/* PROCESSED DATA TAB */}
        <TabPanel>
          <Box overflowX="auto">
            <Table size="sm">
              <Thead bg="gray.100">
                <Tr>
                  <Th>Driver</Th>
                  <Th isNumeric>Repasse</Th>
                  <Th isNumeric>Bônus</Th>
                  <Th isNumeric>Total</Th>
                  <Th>Status</Th>
                  <Th>Pagamento</Th>
                </Tr>
              </Thead>
              <Tbody>
                {processedData.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={4}>
                      {isLoading ? 'Carregando...' : 'Nenhum dado disponível'}
                    </Td>
                  </Tr>
                ) : (
                  processedData.map((record) => {
                    const totalBonus = (record.totalBonusAmount || 0);
                    const total = (record.repasse || 0) + totalBonus;
                    return (
                      <Tr key={record.id} _hover={{ bg: 'gray.50' }}>
                        <Td fontWeight="500">{record.driverName}</Td>
                        <Td isNumeric>€{(record.repasse || 0).toFixed(2)}</Td>
                        <Td isNumeric fontWeight="bold" color="green.600">
                          €{totalBonus.toFixed(2)}
                        </Td>
                        <Td isNumeric fontWeight="bold" fontSize="lg">
                          €{total.toFixed(2)}
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={(record as any).status === 'paid' ? 'green' : 'orange'}
                            variant="subtle"
                          >
                            {(record as any).status || record.paymentStatus || 'pending'}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={record.paymentStatus === 'paid' ? 'green' : 'yellow'}
                            variant="subtle"
                          >
                            {record.paymentStatus || 'pending'}
                          </Badge>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </Box>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
