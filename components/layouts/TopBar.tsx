import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Avatar,
  Button,
  IconButton,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  Tooltip,
} from '@chakra-ui/react';
import { FiBell, FiSettings, FiHome, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';
import { CompactCheckIn } from '@/components/checkin/CompactCheckIn';

interface TopBarProps {
  user: {
    name: string;
    avatar?: string;
    role: 'admin' | 'driver';
  };
  currentPage: string;
  notifications?: number;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  basePath?: string; // '/admin' ou '/drivers'
}

export default function TopBar({
  user,
  currentPage,
  notifications = 0,
  breadcrumbs = [],
  basePath = '/admin'
}: TopBarProps) {
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'driver': return 'Motorista';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'blue';
      case 'driver': return 'green';
      default: return 'gray';
    }
  };

  // Limitar caracteres do nome para não quebrar o layout
  const truncateName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  return (
    <Box bg="white" borderBottom="1px" borderColor="gray.200" py={3} shadow="sm">
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 6 }}>
        <HStack justifyContent="space-between" alignItems="center">
          {/* Left side - Breadcrumbs and Page Info */}
          <VStack align="flex-start" spacing={1} flex={1} minW={0}>
            <Breadcrumb separator={<FiChevronRight size={12} />} fontSize="sm" color="gray.500">
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} href={basePath} _hover={{ color: 'gray.700' }}>
                  <HStack spacing={1}>
                    <FiHome size={14} />
                    <Text>{basePath === '/admin' ? 'Admin' : 'Painel'}</Text>
                  </HStack>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={index} isCurrentPage={index === breadcrumbs.length - 1}>
                  {crumb.href ? (
                    <BreadcrumbLink as={Link} href={crumb.href} _hover={{ color: 'gray.700' }}>
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <Text color="gray.600" fontWeight="medium">{crumb.label}</Text>
                  )}
                </BreadcrumbItem>
              ))}
            </Breadcrumb>
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="gray.800" noOfLines={1}>
              {currentPage}
            </Text>
          </VStack>

          {/* Right side - Notifications and User Info */}
          <HStack spacing={{ base: 2, md: 3 }} flexShrink={0}>
            {/* Check-in para Motoristas */}
            {user.role === 'driver' && (
              <CompactCheckIn isMobile={false} />
            )}

            {/* Notifications */}
            <Tooltip label={`${notifications} notificações`} placement="bottom">
              <Button
                leftIcon={<FiBell />}
                variant="outline"
                size="sm"
                colorScheme={getRoleColor(user.role)}
                borderRadius="full"
                px={4}
                _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                transition="all 0.2s"
              >
                {notifications}
              </Button>
            </Tooltip>

            {/* Settings */}
            <Tooltip label="Configurações" placement="bottom">
              <IconButton
                aria-label="Configurações"
                icon={<FiSettings />}
                variant="outline"
                size="sm"
                borderRadius="full"
                _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                transition="all 0.2s"
              />
            </Tooltip>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
}
