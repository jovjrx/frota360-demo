import { 
  Button, 
  Tooltip,
  ButtonProps,
  Box,
  Text,
  Icon,
} from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';
import { useDemoMode } from '@/hooks/useDemoMode';

interface DemoActionBlockProps {
  children: React.ReactNode;
  actionName?: string;
  message?: string;
  size?: ButtonProps['size'];
  colorScheme?: ButtonProps['colorScheme'];
  variant?: ButtonProps['variant'];
}

/**
 * Wrapper que desabilita ações em modo demo
 */
export function DemoActionBlock({ 
  children, 
  actionName = 'Esta ação',
  message,
  size,
  colorScheme,
  variant 
}: DemoActionBlockProps) {
  const { isDemo, blockAction } = useDemoMode();
  
  // Se não for demo, renderizar normalmente
  if (!isDemo) {
    return <>{children}</>;
  }
  
  // Em modo demo, desabilitar o botão
  const handleClick = () => {
    blockAction(() => {}, message || `${actionName} está desabilitada em modo demonstração.`);
  };
  
  return (
    <Tooltip 
      label={`${message || `${actionName} desabilitada em modo demonstração`}`}
      hasArrow
      bg="orange.500"
      placement="top"
    >
      <Box position="relative">
        {/* Overlay escuro */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.300"
          borderRadius="md"
          zIndex={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={LockIcon} w={4} h={4} color="orange.400" />
        </Box>
        
        {/* Botão desabilitado */}
        {typeof children === 'object' && children && 'type' in children && children.type === Button ? (
          <Button
            {...(children.props as ButtonProps)}
            onClick={handleClick}
            isDisabled
            opacity={0.6}
            cursor="not-allowed"
            size={size}
            colorScheme={colorScheme}
            variant={variant}
          >
            {(children as any).props?.children}
          </Button>
        ) : (
          <Box onClick={handleClick} cursor="not-allowed" opacity={0.6}>
            {children}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}

/**
 * Versão simplificada para botões simples
 */
export function DemoButton({
  children,
  actionName,
  message,
  ...props
}: ButtonProps & { actionName?: string; message?: string }) {
  const { isDemo, blockAction } = useDemoMode();
  
  const onClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDemo) {
      event.preventDefault();
      blockAction(() => {}, message || `${actionName || 'Ação'} está desabilitada em modo demonstração.`);
    } else if (props.onClick) {
      props.onClick(event);
    }
  };
  
  return (
    <Button
      {...props}
      onClick={onClickHandler}
      isDisabled={isDemo}
      opacity={isDemo ? 0.6 : 1}
      cursor={isDemo ? 'not-allowed' : 'pointer'}
    >
      {children}
      {isDemo && <LockIcon ml={2} />}
    </Button>
  );
}

