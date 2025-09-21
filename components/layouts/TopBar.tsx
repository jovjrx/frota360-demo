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
      <Box maxW="7xl" mx="auto" px={4}>
        <HStack justifyContent="space-between" alignItems="center">
          {/* Left side - Breadcrumbs and Page Info */}
          <VStack align="flex-start" spacing={1}>
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
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              {currentPage}
            </Text>
          </VStack>

          {/* Right side - Notifications and User Info */}
          <HStack spacing={3}>
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

            {/* User Info */}
            <HStack spacing={3} px={3} py={2} bg="gray.50" borderRadius="full" _hover={{ bg: 'gray.100' }} transition="all 0.2s">
              <Avatar 
                size="sm" 
                name={user.name}
                bg={`${getRoleColor(user.role)}.500`}
                border="2px solid"
                borderColor="white"
                shadow="sm"
              />
              <VStack align="flex-start" spacing={0}>
                <Tooltip label={user.name} placement="bottom">
                  <Text fontSize="sm" fontWeight="semibold" color="gray.800" maxW="120px" isTruncated>
                    {truncateName(user.name, 15)}
                  </Text>
                </Tooltip>
                <HStack spacing={1}>
                  <Badge colorScheme={getRoleColor(user.role)} size="sm" borderRadius="full">
                    {getRoleText(user.role)}
                  </Badge>
                  <Badge colorScheme="green" size="sm" borderRadius="full">
                    Online
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
}
