import { Alert, AlertIcon, AlertTitle, AlertDescription, Box } from '@chakra-ui/react';
import { useDemoMode } from '@/hooks/useDemoMode';

/**
 * Banner de aviso do modo demonstração
 */
export function DemoBanner() {
  const { isDemo } = useDemoMode();
  
  if (!isDemo) return null;
  
  return (
    <Box position="sticky" top={0} zIndex={9999}>
      <Alert status="warning" borderRadius="none" colorScheme="orange">
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>Modo Demonstração</AlertTitle>
          <AlertDescription>
            Você está em um ambiente de demonstração. Ações de modificação estão desabilitadas para proteção.
          </AlertDescription>
        </Box>
      </Alert>
    </Box>
  );
}

