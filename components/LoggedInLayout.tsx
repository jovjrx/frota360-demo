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
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  VStack,
  Divider,
} from '@chakra-ui/react';
import { FiBell, FiHome, FiChevronRight, FiSettings } from 'react-icons/fi';
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

  const defaultBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    ...breadcrumbs
  ];

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header Moderno */}
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
                  Painel Administrativo
                </Text>
              </VStack>
            </HStack>

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
      {defaultBreadcrumbs.length > 1 && (
        <Box bg="white" borderBottom="1px" borderColor="gray.100" py={3}>
          <Container maxW="7xl">
            <Breadcrumb separator={<FiChevronRight color="gray.500" />}>
              {defaultBreadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={index} isCurrentPage={index === defaultBreadcrumbs.length - 1}>
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
