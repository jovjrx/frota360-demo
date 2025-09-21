import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Tooltip,
  Button,
  useToast,
} from '@chakra-ui/react';
import { FiMapPin, FiClock, FiCheckCircle, FiPause, FiPlay } from 'react-icons/fi';
import { useCheckIn } from '@/lib/hooks/useCheckIn';
import { formatPortugalTime } from '@/lib/timezone';

interface CompactCheckInProps {
  isMobile?: boolean;
}

export function CompactCheckIn({ isMobile = false }: CompactCheckInProps) {
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

  const handleQuickCheckIn = async () => {
    try {
      await doCheckIn('manual');
      toast({
        title: 'Check-in realizado!',
        description: 'Seu check-in foi registrado com sucesso.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro no check-in',
        description: 'Não foi possível registrar o check-in.',
        status: 'error',
        duration: 3000,
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
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isMobile) {
    return (
      <VStack spacing={2} align="stretch" w="full">
        {/* Status e Check-in */}
        <HStack justify="space-between" w="full">
          <HStack spacing={2}>
            <Badge
              colorScheme={isActive ? 'green' : 'gray'}
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="full"
            >
              {isActive ? 'Operando' : 'Inativo'}
            </Badge>
            <Text fontSize="xs" color="gray.600">
              {checkinCount} check-ins
            </Text>
          </HStack>
          
          <Button
            size="xs"
            colorScheme="blue"
            onClick={handleQuickCheckIn}
            isLoading={isLoading}
            loadingText="..."
            leftIcon={<Icon as={FiMapPin} />}
          >
            Check-in
          </Button>
        </HStack>

        {/* Último Check-in */}
        {lastCheckin && (
          <HStack spacing={2}>
            <Icon as={FiClock} color="gray.500" boxSize={3} />
            <Text fontSize="xs" color="gray.600">
              Último: {formatPortugalTime(lastCheckin, 'HH:mm')}
            </Text>
          </HStack>
        )}

        {/* Próximo Check-in */}
        {isActive && nextCheckin && (
          <HStack spacing={2}>
            <Icon as={FiCheckCircle} color="green.500" boxSize={3} />
            <Text fontSize="xs" color="green.600">
              Próximo: {formatPortugalTime(nextCheckin, 'HH:mm')}
            </Text>
          </HStack>
        )}

        {/* Botão de Status */}
        <Button
          size="xs"
          colorScheme={isActive ? 'orange' : 'green'}
          onClick={handleToggleStatus}
          isLoading={isLoading}
          loadingText="..."
          leftIcon={<Icon as={isActive ? FiPause : FiPlay} />}
        >
          {isActive ? 'Pausar' : 'Iniciar'} Operação
        </Button>
      </VStack>
    );
  }

  return (
    <HStack spacing={3}>
      {/* Status */}
      <Tooltip label={`Status: ${isActive ? 'Operando' : 'Inativo'}`} placement="bottom">
        <Badge
          colorScheme={isActive ? 'green' : 'gray'}
          fontSize="sm"
          px={3}
          py={1}
          borderRadius="full"
        >
          {isActive ? 'Operando' : 'Inativo'}
        </Badge>
      </Tooltip>

      {/* Último Check-in */}
      {lastCheckin && (
        <Tooltip label={`Último check-in: ${formatPortugalTime(lastCheckin, 'dd/MM/yyyy HH:mm')}`} placement="bottom">
          <HStack spacing={1}>
            <Icon as={FiClock} color="gray.500" boxSize={4} />
            <Text fontSize="sm" color="gray.600">
              {formatPortugalTime(lastCheckin, 'HH:mm')}
            </Text>
          </HStack>
        </Tooltip>
      )}

      {/* Próximo Check-in */}
      {isActive && nextCheckin && (
        <Tooltip label={`Próximo check-in: ${formatPortugalTime(nextCheckin, 'dd/MM/yyyy HH:mm')}`} placement="bottom">
          <HStack spacing={1}>
            <Icon as={FiCheckCircle} color="green.500" boxSize={4} />
            <Text fontSize="sm" color="green.600">
              {formatPortugalTime(nextCheckin, 'HH:mm')}
            </Text>
          </HStack>
        </Tooltip>
      )}

      {/* Check-in Rápido */}
      <Tooltip label="Fazer check-in manual" placement="bottom">
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleQuickCheckIn}
          isLoading={isLoading}
          loadingText="Check-in..."
          leftIcon={<Icon as={FiMapPin} />}
        >
          Check-in
        </Button>
      </Tooltip>

      {/* Toggle Status */}
      <Tooltip label={isActive ? 'Pausar operação' : 'Iniciar operação'} placement="bottom">
        <Button
          size="sm"
          colorScheme={isActive ? 'orange' : 'green'}
          onClick={handleToggleStatus}
          isLoading={isLoading}
          loadingText="Alterando..."
          leftIcon={<Icon as={isActive ? FiPause : FiPlay} />}
        >
          {isActive ? 'Pausar' : 'Iniciar'}
        </Button>
      </Tooltip>
    </HStack>
  );
}
