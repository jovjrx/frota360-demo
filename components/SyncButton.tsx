import { Button, Icon, Spinner } from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';

interface SyncButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: string;
}

export default function SyncButton({
  onClick,
  isLoading = false,
  disabled = false,
  label = 'Sincronizar',
  size = 'md',
  colorScheme = 'blue',
}: SyncButtonProps) {
  return (
    <Button
      leftIcon={isLoading ? <Spinner size="sm" /> : <Icon as={FiRefreshCw} />}
      onClick={onClick}
      isLoading={isLoading}
      isDisabled={disabled || isLoading}
      colorScheme={colorScheme}
      size={size}
      loadingText="Sincronizando..."
    >
      {label}
    </Button>
  );
}
