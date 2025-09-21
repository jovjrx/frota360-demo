import React from 'react';
import {
  Box,
  Button,
  Badge,
  HStack,
  VStack,
  Text,
  Icon,
  useToast,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { FiMapPin, FiClock, FiCheckCircle, FiPause } from 'react-icons/fi';
import { formatPortugalTime } from '@/lib/timezone';
import { useCheckIn } from '@/lib/hooks/useCheckIn';

export function CheckInManager() {
  const {
    isActive,
    lastCheckin,
    nextCheckin,
    checkinCount,
    isLoading,
    error,
    doCheckIn,
    updateStatus
  } = useCheckIn();

  const toast = useToast();

  const handleCheckIn = async () => {
    try {
      await doCheckIn('manual');
      toast({
        title: 'Check-in realizado!',
        description: 'Seu check-in foi registrado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro no check-in',
        description: 'Não foi possível registrar o check-in.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleToggleStatus = async () => {
    try {
      await updateStatus(!isActive);
      toast({
        title: isActive ? 'Status alterado para inativo' : 'Status alterado para ativo',
        description: isActive 
          ? 'Check-ins automáticos foram pausados.' 
          : 'Check-ins automáticos foram iniciados.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle>Erro:</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <VStack spacing={4} align="stretch">
        {/* Status Atual */}
        <Box
          p={4}
          bg="white"
          borderRadius="lg"
          border="1px"
          borderColor="gray.200"
          boxShadow="sm"
        >
          <HStack justify="space-between" mb={3}>
            <Text fontSize="lg" fontWeight="semibold">
              Status Atual
            </Text>
            <Badge
              colorScheme={isActive ? 'green' : 'gray'}
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
            >
              {isActive ? 'Operando' : 'Inativo'}
            </Badge>
          </HStack>

          <VStack spacing={2} align="stretch">
            <HStack>
              <Icon as={FiClock} color="gray.500" />
              <Text fontSize="sm" color="gray.600">
                Último check-in: {lastCheckin ? formatPortugalTime(lastCheckin, 'HH:mm') : 'Nenhum'}
              </Text>
            </HStack>

            {isActive && nextCheckin && (
              <HStack>
                <Icon as={FiCheckCircle} color="green.500" />
                <Text fontSize="sm" color="green.600">
                  Próximo check-in: {formatPortugalTime(nextCheckin, 'HH:mm')}
                </Text>
              </HStack>
            )}

            <HStack>
              <Icon as={FiMapPin} color="blue.500" />
              <Text fontSize="sm" color="blue.600">
                Total de check-ins: {checkinCount}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Botões de Ação */}
        <HStack spacing={3}>
          <Button
            onClick={handleToggleStatus}
            colorScheme={isActive ? 'orange' : 'green'}
            leftIcon={<Icon as={isActive ? FiPause : FiCheckCircle} />}
            isLoading={isLoading}
            loadingText="Alterando..."
            flex={1}
          >
            {isActive ? 'Pausar Operação' : 'Iniciar Operação'}
          </Button>

          <Tooltip label="Fazer check-in manual">
            <Button
              onClick={handleCheckIn}
              colorScheme="blue"
              leftIcon={<Icon as={FiMapPin} />}
              isLoading={isLoading}
              loadingText="Check-in..."
              flex={1}
            >
              Fazer Check-in
            </Button>
          </Tooltip>
        </HStack>

        {/* Informações Adicionais */}
        {isActive && (
          <Box
            p={3}
            bg="green.50"
            borderRadius="md"
            border="1px"
            borderColor="green.200"
          >
            <Text fontSize="sm" color="green.700" textAlign="center">
              ✅ Check-ins automáticos ativos a cada 5 minutos
            </Text>
          </Box>
        )}

        {!isActive && (
          <Box
            p={3}
            bg="gray.50"
            borderRadius="md"
            border="1px"
            borderColor="gray.200"
          >
            <Text fontSize="sm" color="gray.600" textAlign="center">
              ⏸️ Check-ins automáticos pausados
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
