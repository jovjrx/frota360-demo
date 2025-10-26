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
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  IconButton,
  Avatar,
  MenuDivider,
  useBreakpointValue,
  Badge,
  Icon,
} from '@chakra-ui/react';
import {
  FiHome,
  FiChevronRight,
  FiGrid,
  FiChevronDown,
  FiLogOut,
  FiUser,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  getMainMenuItems,
  getMoreMenuItems,
  getAllMenuItems,
  isMenuItemActive,
} from '@/config/adminMenu';

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
  
  // Mobile: esconde o menu horizontal, mostra apenas dropdown do usuário
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const showHorizontalMenu = !isMobile && isAdminRoute;

  const mainMenuItems = getMainMenuItems();
  const moreMenuItems = getMoreMenuItems();
  const allMenuItems = getAllMenuItems();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, redirecionar
      router.push('/login');
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" shadow="sm">
        <Container maxW="7xl">
          <HStack justify="space-between" py={4} spacing={4}>
            {/* Logo */}
            <HStack spacing={3}>
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
              <VStack align="start" spacing={0} display={{ base: 'none', md: 'flex' }}>
                <Text fontWeight="bold" fontSize="lg" color="gray.900">
                  Frota360.pt
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {isAdminRoute ? 'Painel Admin' : 'Painel'}
                </Text>
              </VStack>
            </HStack>

            {/* Menu Horizontal (Desktop apenas) */}
            {showHorizontalMenu && (
              <HStack spacing={1} flex={1} justify="center">
                {mainMenuItems.map((item) => (
                  <Button
                    key={item.id}
                    as={Link}
                    href={item.href}
                    variant={isMenuItemActive(item.href, router.pathname) ? 'solid' : 'ghost'}
                    colorScheme={isMenuItemActive(item.href, router.pathname) ? 'green' : 'gray'}
                    size="sm"
                    leftIcon={<Icon as={item.icon} />}
                  >
                    {item.label}
                  </Button>
                ))}

                {/* Dropdown "Mais" */}
                {moreMenuItems.length > 0 && (
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
                      {moreMenuItems.map((item) => (
                        <MenuItem
                          key={item.id}
                          icon={<Icon as={item.icon} />}
                          as={Link}
                          href={item.href}
                        >
                          {item.label}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                )}
              </HStack>
            )}

            {/* Spacer no mobile */}
            {isMobile && <Box flex={1} />}

            {/* Menu do Usuário */}
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<Avatar size="sm" name="Admin" />}
                variant="ghost"
                aria-label="Menu do usuário"
              />
              <MenuList>
                {/* Cabeçalho */}
                <Box px={3} py={2}>
                  <Text fontWeight="bold" fontSize="sm">
                    Administrador
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    admin@conduz.pt
                  </Text>
                </Box>
                
                <MenuDivider />

                {/* Mobile: Mostrar todos os itens do menu */}
                {isMobile && isAdminRoute && (
                  <>
                    {allMenuItems.map((item) => (
                      <MenuItem
                        key={item.id}
                        icon={<Icon as={item.icon} />}
                        as={Link}
                        href={item.href}
                        bg={isMenuItemActive(item.href, router.pathname) ? 'green.50' : undefined}
                        color={isMenuItemActive(item.href, router.pathname) ? 'green.600' : undefined}
                      >
                        <HStack justify="space-between" w="full">
                          <Text>{item.label}</Text>
                          {isMenuItemActive(item.href, router.pathname) && (
                            <Badge colorScheme="green" size="sm">
                              Ativo
                            </Badge>
                          )}
                        </HStack>
                      </MenuItem>
                    ))}
                    <MenuDivider />
                  </>
                )}

                {/* Opções gerais */}
                <MenuItem icon={<FiUser />} as={Link} href="/admin/profile">
                  Meu Perfil
                </MenuItem>
                <MenuItem icon={<FiLogOut />} onClick={handleLogout} color="red.500">
                  Sair
                </MenuItem>
              </MenuList>
            </Menu>
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
