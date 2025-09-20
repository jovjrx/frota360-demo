import React from 'react';
import {
  Box,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullHeight?: boolean;
}

export function LoadingSpinner({ 
  message = 'Carregando...', 
  size = 'lg',
  fullHeight = true 
}: LoadingSpinnerProps) {
  const textColor = 'gray.600';

  const containerProps = fullHeight ? {
    minH: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } : {
    py: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <Box {...containerProps}>
      <VStack spacing={4}>
        <Spinner 
          size={size} 
          color="green.500" 
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
        />
        <Text color={textColor} fontSize="sm">
          {message}
        </Text>
      </VStack>
    </Box>
  );
}
