'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Container,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  Heading,
  Text,
  HStack,
  IconButton,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from '@chakra-ui/react';
import { 
  FiBell, 
  FiHome, 
  FiChevronRight, 
  FiSettings,
  FiUsers,
  FiTruck,
  FiActivity,
  FiFileText,
  FiGrid,
  FiChevronDown,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NotificationBadge from './notifications/NotificationBadge';

interface LoggedInLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export default function LoggedInLayout({ 
  children, 
  title, 
  subtitle, 
  breadcrumbs = [] 
}: LoggedInLayoutProps) {
  const router = useRouter();
  const isAdminRoute = useMemo(() => router.pathname.startsWith('/admin'), [router.pathname]);

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" shadow="sm">
        <Container maxW="7xl">
          <HStack justify="space-between" py={4}>
            {/* Logo e Nome */}
            <HStack spacing={4}>
              <Box
                w="40px"
                h="40px"
                bg="green.500"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontWeight="bold"
                fontSize="lg"
              >
                C
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="lg" color="gray.900">
                  Conduz.pt
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {isAdminRoute ? 'Painel Admin' : 'Painel'}
                </Text>
              </VStack>
            </HStack>

            {/* Menu de Navegação Admin */}
            {isAdminRoute && (
              <HStack spacing={1}>
                <Button
                  as={Link}
                  href="/admin"
                  variant={router.pathname === '/admin' ? 'solid' : 'ghost'}
                  colorScheme={router.pathname === '/admin' ? 'green' : 'gray'}
                  size="sm"
                  leftIcon={<FiHome />}
                >
                  Dashboard
                </Button>

                <Button
                  as={Link}
                  href="/admin/requests"
                  variant={router.pathname.startsWith('/admin/requests') ? 'solid' : 'ghost'}
                  colorScheme={router.pathname.startsWith('/admin/requests') ? 'green' : 'gray'}
                  size="sm"
                  leftIcon={<FiFileText />}
                >
                  Solicitações
                </Button>

                <Button
                  as={Link}
                  href="/admin/drivers"
                  variant={router.pathname.startsWith('/admin/drivers') ? 'solid' : 'ghost'}
                  colorScheme={router.pathname.startsWith('/admin/drivers') ? 'green' : 'gray'}
                  size="sm"
                  leftIcon={<FiUsers />}
                >
                  Motoristas
                </Button>

                <Button
                  as={Link}
                  href="/admin/fleet"
                  variant={router.pathname.startsWith('/admin/fleet') ? 'solid' : 'ghost'}
                  colorScheme={router.pathname.startsWith('/admin/fleet') ? 'green' : 'gray'}
                  size="sm"
                  leftIcon={<FiTruck />}
                >
                  Frota
                </Button>

                <Menu>
                  <MenuButton
                    as={Button}
                    size="sm"
                    variant="ghost"
                    rightIcon={<FiChevronDown />}
                    leftIcon={<FiGrid />}
                  >
                    Mais
                  </MenuButton>
                  <MenuList>
                    <MenuItem icon={<FiActivity />} as={Link} href="/admin/metrics">
                      Métricas
                    </MenuItem>
                    <MenuItem icon={<FiSettings />} as={Link} href="/admin/integrations">
                      Integrações
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            )}

            {/* Spacer */}
            <Box flex={1} />

            {/* Ações do Header */}
            <HStack spacing={2}>
              {/* Notificações */}
              <NotificationBadge />

              {/* Configurações */}
              <IconButton
                icon={<FiSettings />}
                variant="ghost"
                size="sm"
                aria-label="Configurações"
              />
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Box bg="white" borderBottom="1px" borderColor="gray.100" py={3}>
          <Container maxW="7xl">
            <Breadcrumb separator={<FiChevronRight color="gray.500" />}>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} href={isAdminRoute ? '/admin' : '/drivers'} fontSize="sm">
                  <HStack spacing={1}>
                    <FiHome size={14} />
                    <Text>Início</Text>
                  </HStack>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={index} isCurrentPage={index === breadcrumbs.length - 1}>
                  {crumb.href ? (
                    <BreadcrumbLink as={Link} href={crumb.href} fontSize="sm">
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <Text fontSize="sm" color="gray.600">
                      {crumb.label}
                    </Text>
                  )}
                </BreadcrumbItem>
              ))}
            </Breadcrumb>
          </Container>
        </Box>
      )}

      {/* Conteúdo Principal */}
      <Container maxW="7xl" py={8}>
        {/* Título da Página */}
        {title && (
          <Box mb={8}>
            <Heading size="lg" mb={2} color="gray.900">
              {title}
            </Heading>
            {subtitle && (
              <Text color="gray.600" fontSize="lg">
                {subtitle}
              </Text>
            )}
          </Box>
        )}

        {/* Conteúdo */}
        {children}
      </Container>
    </Box>
  );
}
