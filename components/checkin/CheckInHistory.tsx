import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  VStack,
  HStack,
  Icon,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { FiMapPin, FiClock, FiEye, FiDownload } from 'react-icons/fi';
import { formatPortugalTime } from '@/lib/timezone';
import { CheckIn } from '@/schemas/checkin';
import { useCheckIn } from '@/lib/hooks/useCheckIn';

export function CheckInHistory() {
  const { checkinHistory, fetchCheckinHistory } = useCheckIn();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckinHistory();
  }, [fetchCheckinHistory]);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchCheckinHistory();
    } catch (error) {
      setError('Erro ao carregar histórico');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Data', 'Hora', 'Tipo', 'Status', 'Cidade', 'País', 'IP'],
      ...checkinHistory.map(checkin => [
        formatPortugalTime(checkin.timestamp, 'dd/MM/yyyy'),
        formatPortugalTime(checkin.timestamp, 'HH:mm:ss'),
        checkin.type === 'automatic' ? 'Automático' : 'Manual',
        checkin.status === 'active' ? 'Ativo' : 'Inativo',
        checkin.location.city,
        checkin.location.country,
        checkin.location.ip
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `checkins_${formatPortugalTime(Date.now(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="semibold">
          Histórico de Check-ins
        </Text>
        <HStack>
          <Button
            onClick={handleRefresh}
            isLoading={isLoading}
            loadingText="Carregando..."
            size="sm"
            variant="outline"
          >
            Atualizar
          </Button>
          <Button
            onClick={handleExport}
            leftIcon={<Icon as={FiDownload} />}
            size="sm"
            colorScheme="blue"
            variant="outline"
          >
            Exportar CSV
          </Button>
          <Button
            onClick={onOpen}
            leftIcon={<Icon as={FiEye} />}
            size="sm"
            colorScheme="blue"
          >
            Ver Detalhes
          </Button>
        </HStack>
      </HStack>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle>Erro:</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Box
        bg="white"
        borderRadius="lg"
        border="1px"
        borderColor="gray.200"
        boxShadow="sm"
        overflow="hidden"
      >
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Data/Hora</Th>
              <Th>Tipo</Th>
              <Th>Status</Th>
              <Th>Localização</Th>
              <Th>IP</Th>
            </Tr>
          </Thead>
          <Tbody>
            {checkinHistory.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={8}>
                  <VStack spacing={2}>
                    <Icon as={FiMapPin} boxSize={8} color="gray.400" />
                    <Text color="gray.500">Nenhum check-in registrado</Text>
                  </VStack>
                </Td>
              </Tr>
            ) : (
              checkinHistory.map((checkin) => (
                <Tr key={checkin.id}>
                  <Td>
                    <VStack spacing={1} align="start">
                      <Text fontSize="sm" fontWeight="medium">
                        {formatPortugalTime(checkin.timestamp, 'dd/MM/yyyy')}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {formatPortugalTime(checkin.timestamp, 'HH:mm:ss')}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={checkin.type === 'automatic' ? 'blue' : 'green'}
                      fontSize="xs"
                    >
                      {checkin.type === 'automatic' ? 'Automático' : 'Manual'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={checkin.status === 'active' ? 'green' : 'gray'}
                      fontSize="xs"
                    >
                      {checkin.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </Td>
                  <Td>
                    <VStack spacing={1} align="start">
                      <Text fontSize="sm" fontWeight="medium">
                        {checkin.location.city}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {checkin.location.country}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Text fontSize="xs" color="gray.500" fontFamily="mono">
                      {checkin.location.ip}
                    </Text>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Modal com Detalhes */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes dos Check-ins</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              {checkinHistory.map((checkin) => (
                <Box
                  key={checkin.id}
                  p={4}
                  bg="gray.50"
                  borderRadius="md"
                  border="1px"
                  borderColor="gray.200"
                >
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="semibold">
                      {formatPortugalTime(checkin.timestamp, 'dd/MM/yyyy HH:mm:ss')}
                    </Text>
                    <Badge
                      colorScheme={checkin.type === 'automatic' ? 'blue' : 'green'}
                    >
                      {checkin.type === 'automatic' ? 'Automático' : 'Manual'}
                    </Badge>
                  </HStack>
                  
                  <VStack spacing={2} align="stretch">
                    <HStack>
                      <Icon as={FiMapPin} color="blue.500" />
                      <Text fontSize="sm">
                        {checkin.location.city}, {checkin.location.country}
                      </Text>
                    </HStack>
                    
                    <HStack>
                      <Icon as={FiClock} color="gray.500" />
                      <Text fontSize="sm" color="gray.600">
                        Status: {checkin.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Text>
                    </HStack>
                    
                    <Text fontSize="xs" color="gray.500" fontFamily="mono">
                      IP: {checkin.location.ip}
                    </Text>
                  </VStack>
                </Box>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
