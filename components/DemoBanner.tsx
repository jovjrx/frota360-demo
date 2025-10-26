import { Box, HStack, WarningIcon } from '@chakra-ui/react';

export function DemoBanner() {
  return (
    <Box 
      bg="yellow.50" 
      borderBottom="2px solid" 
      borderColor="yellow.200"
      p={3}
      textAlign="center"
    >
      <HStack justify="center" spacing={2}>
        <WarningIcon color="yellow.600" />
        <Box fontSize="sm" color="yellow.800" fontWeight="500">
          ⚠️ Modo Demonstração - Usando dados fictícios. Nenhum dado será salvo.
        </Box>
      </HStack>
    </Box>
  );
}

