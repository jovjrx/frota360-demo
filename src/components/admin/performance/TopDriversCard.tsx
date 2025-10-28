import React from 'react';
import {
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  VStack,
  Text,
  Icon,
  Box,
} from '@chakra-ui/react';
import { FiTrendingUp, FiUser, FiDollarSign } from 'react-icons/fi';

export interface TopDriver {
  driverId: string;
  driverName: string;
  totalEarnings: number;
  totalRepasse: number;
  weeks: number;
  avgWeekly: number;
  trips: number;
  adminFeePercentage: number;
}

export function TopDriversCard({ drivers }: { drivers: TopDriver[] }) {
  if (!drivers || drivers.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text color="gray.500">Nenhum driver com dados no período</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <HStack>
            <Icon as={FiTrendingUp} color="green.500" boxSize={5} />
            <Text fontWeight="bold" fontSize="lg">
              🏆 Top Drivers por Ganhos
            </Text>
          </HStack>

          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>#</Th>
                  <Th>Driver</Th>
                  <Th isNumeric>Ganhos</Th>
                  <Th isNumeric>Repasse</Th>
                  <Th isNumeric>Semanas</Th>
                  <Th isNumeric>Média/Semana</Th>
                  <Th isNumeric>Taxa %</Th>
                </Tr>
              </Thead>
              <Tbody>
                {drivers.slice(0, 10).map((driver, idx) => (
                  <Tr key={driver.driverId}>
                    <Td fontWeight="bold">{idx + 1}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Icon as={FiUser} />
                        <Text>{driver.driverName || 'N/A'}</Text>
                      </HStack>
                    </Td>
                    <Td isNumeric fontWeight="bold" color="green.600">
                      €{driver.totalEarnings.toFixed(2)}
                    </Td>
                    <Td isNumeric color="blue.600">
                      €{driver.totalRepasse.toFixed(2)}
                    </Td>
                    <Td isNumeric>
                      <Badge colorScheme="purple">{driver.weeks}</Badge>
                    </Td>
                    <Td isNumeric>
                      €{driver.avgWeekly.toFixed(2)}
                    </Td>
                    <Td isNumeric color="red.500">
                      {driver.adminFeePercentage.toFixed(1)}%
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          <Text fontSize="xs" color="gray.500">
            Total: {drivers.length} drivers | Período: {drivers[0]?.weeks || 0} semanas
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );
}
