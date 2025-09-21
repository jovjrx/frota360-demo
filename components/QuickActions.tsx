import React from 'react';
import {
  Box,
  SimpleGrid,
  Button,
  Text,
  Icon,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiDollarSign,
  FiSettings,
  FiFileText,
  FiTrendingUp,
  FiCalendar,
  FiShield,
  FiUserCheck,
} from 'react-icons/fi';
import { useRouter } from 'next/router';

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  href: string;
  color: string;
  description?: string;
}

interface QuickActionsProps {
  userRole: 'admin' | 'driver';
  userData?: any;
}

export default function QuickActions({ userRole, userData }: QuickActionsProps) {
  const router = useRouter();
  
  const adminActions: QuickAction[] = [
    {
      id: 'drivers',
      label: 'Gerenciar Motoristas',
      icon: FiUsers,
      href: '/admin/drivers',
      color: 'blue',
      description: 'Visualizar e gerenciar todos os motoristas'
    },
    {
      id: 'users',
      label: 'Usuários do Sistema',
      icon: FiUserCheck,
      href: '/admin/users',
      color: 'purple',
      description: 'Gerenciar administradores e usuários'
    },
    {
      id: 'payments',
      label: 'Pagamentos',
      icon: FiDollarSign,
      href: '/admin/payments',
      color: 'green',
      description: 'Histórico e gestão de pagamentos'
    },
    {
      id: 'plans',
      label: 'Planos',
      icon: FiSettings,
      href: '/admin/plans',
      color: 'orange',
      description: 'Configurar planos e comissões'
    }
  ];

  const driverActions: QuickAction[] = [
    {
      id: 'profile',
      label: 'Meu Perfil',
      icon: FiUsers,
      href: '/drivers/profile',
      color: 'blue',
      description: 'Editar informações pessoais'
    },
    {
      id: 'documents',
      label: 'Documentos',
      icon: FiFileText,
      href: '/drivers/documents',
      color: 'purple',
      description: 'Enviar e gerenciar documentos'
    },
    {
      id: 'payments',
      label: 'Pagamentos',
      icon: FiDollarSign,
      href: '/drivers/payments',
      color: 'green',
      description: 'Histórico de ganhos e pagamentos'
    },
    {
      id: 'analytics',
      label: 'Relatórios',
      icon: FiTrendingUp,
      href: '/drivers/analytics',
      color: 'orange',
      description: 'Análise de performance e ganhos'
    }
  ];

  const actions = userRole === 'admin' ? adminActions : driverActions;

  const handleActionClick = (action: QuickAction) => {
    router.push(action.href);
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="semibold" color="gray.700">
          Ações Rápidas
        </Text>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="lg"
              h="auto"
              p={4}
              onClick={() => handleActionClick(action)}
              _hover={{
                transform: 'translateY(-2px)',
                shadow: 'md',
                borderColor: `${action.color}.300`,
              }}
              transition="all 0.2s"
              borderRadius="lg"
              borderColor="gray.200"
              bg="white"
            >
              <VStack spacing={3} align="center" w="full">
                <Icon
                  as={action.icon}
                  boxSize={8}
                  color={`${action.color}.500`}
                />
                <VStack spacing={1} align="center">
                  <Text fontWeight="semibold" fontSize="sm" textAlign="center">
                    {action.label}
                  </Text>
                  {action.description && (
                    <Text fontSize="xs" color="gray.600" textAlign="center">
                      {action.description}
                    </Text>
                  )}
                </VStack>
              </VStack>
            </Button>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
