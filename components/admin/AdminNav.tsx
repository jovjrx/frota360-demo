'use client';

import { useRouter } from 'next/router';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Divider,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiTruck,
  FiCalendar,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiFileText,
  FiActivity,
  FiLogOut,
} from 'react-icons/fi';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number;
  description?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: FiHome,
    description: 'Visão geral do sistema',
  },
  {
    label: 'Solicitações',
    href: '/admin/requests',
    icon: FiFileText,
    description: 'Gerenciar solicitações de motoristas',
  },
  {
    label: 'Controle de Motoristas',
    href: '/admin/drivers-weekly',
    icon: FiUsers,
    description: 'Controle semanal de motoristas',
  },
  {
    label: 'Controle de Frota',
    href: '/admin/fleet',
    icon: FiTruck,
    description: 'Gestão completa da frota',
  },
  {
    label: 'Integrações',
    href: '/admin/integrations',
    icon: FiActivity,
    description: 'Status das integrações',
  },
];

interface AdminNavProps {
  isCompact?: boolean;
}

export default function AdminNav({ isCompact = false }: AdminNavProps) {
  const router = useRouter();
  
  const isActive = (href: string) => {
    if (href === '/admin') {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (isCompact) {
    return (
      <VStack spacing={2} align="stretch" w="full">
        {navItems.map((item) => (
          <Tooltip key={item.href} label={item.label} placement="right">
            <Button
              as={Link}
              href={item.href}
              variant={isActive(item.href) ? 'solid' : 'ghost'}
              colorScheme={isActive(item.href) ? 'blue' : 'gray'}
              justifyContent="center"
              size="sm"
              p={2}
            >
              <Icon as={item.icon} boxSize={5} />
            </Button>
          </Tooltip>
        ))}
        <Divider />
        <Tooltip label="Sair" placement="right">
          <Button
            variant="ghost"
            colorScheme="red"
            justifyContent="center"
            size="sm"
            p={2}
            onClick={handleLogout}
          >
            <Icon as={FiLogOut} boxSize={5} />
          </Button>
        </Tooltip>
      </VStack>
    );
  }

  return (
    <VStack spacing={1} align="stretch" w="full">
      {navItems.map((item) => (
        <Button
          key={item.href}
          as={Link}
          href={item.href}
          variant={isActive(item.href) ? 'solid' : 'ghost'}
          colorScheme={isActive(item.href) ? 'blue' : 'gray'}
          justifyContent="flex-start"
          size="md"
          leftIcon={<Icon as={item.icon} />}
          rightIcon={item.badge ? <Badge colorScheme="red">{item.badge}</Badge> : undefined}
          fontWeight={isActive(item.href) ? 'bold' : 'normal'}
          _hover={{
            bg: isActive(item.href) ? undefined : 'gray.100',
            transform: 'translateX(4px)',
          }}
          transition="all 0.2s"
        >
          <HStack w="full" justify="space-between">
            <Text>{item.label}</Text>
          </HStack>
        </Button>
      ))}
      
      <Divider my={2} />
      
      <Button
        variant="ghost"
        colorScheme="red"
        justifyContent="flex-start"
        size="md"
        leftIcon={<Icon as={FiLogOut} />}
        onClick={handleLogout}
      >
        Sair
      </Button>
    </VStack>
  );
}
