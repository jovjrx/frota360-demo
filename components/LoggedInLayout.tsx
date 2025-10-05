import React from 'react';
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
  Flex,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiBell, FiHome, FiChevronRight, FiSettings, FiMenu } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NotificationBadge from './notifications/NotificationBadge';
import AdminNav from './admin/AdminNav';

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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const isAdminRoute = router.pathname.startsWith('/admin');

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Sidebar Desktop - Apenas para rotas admin */}
      {isAdminRoute && !isMobile && (
        <Box
          w="280px"
          bg="white"
          borderRight="1px"
          borderColor="gray.200"
          position="fixed"
          h="100vh"
          overflowY="auto"
        >
          <VStack spacing={4} p={4} align="stretch">
            {/* Logo */}
            <Box textAlign="center" py={4}>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                Conduz.pt
              </Text>
              <Text fontSize="sm" color="gray.500">
                Painel Administrativo
              </Text>
            </Box>

            {/* Navigation */}
            <AdminNav />
          </VStack>
        </Box>
      )}

      {/* Drawer Mobile - Apenas para rotas admin */}
      {isAdminRoute && (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              <Text fontSize="xl" fontWeight="bold" color="green.500">
                Conduz.pt
              </Text>
            </DrawerHeader>
            <DrawerBody>
              <AdminNav />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        flex={1}
        ml={{ base: 0, lg: isAdminRoute ? '280px' : 0 }}
        transition="margin-left 0.2s"
      >
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" shadow="sm">
          <Container maxW="7xl">
            <HStack justify="space-between" py={4}>
              {/* Mobile Menu Button - Apenas para admin */}
              {isAdminRoute && isMobile && (
                <IconButton
                  icon={<FiMenu />}
                  variant="ghost"
                  onClick={onOpen}
                  aria-label="Abrir menu"
                />
              )}

              {/* Logo e Nome */}
              {!isAdminRoute && (
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
                      Painel
                    </Text>
                  </VStack>
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
    </Flex>
  );
}
