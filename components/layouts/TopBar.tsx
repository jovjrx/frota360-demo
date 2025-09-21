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

  return (
    <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4} shadow="sm">
      <Box maxW="7xl" mx="auto" px={4}>
        <HStack justifyContent="space-between" alignItems="center">
          {/* Left side - Breadcrumbs and Page Info */}
          <VStack align="flex-start" spacing={1}>
            <Breadcrumb separator={<FiChevronRight size={12} />} fontSize="sm">
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} href={basePath}>
                  <HStack spacing={1}>
                    <FiHome size={14} />
                    <Text>{basePath === '/admin' ? 'Admin' : 'Painel'}</Text>
                  </HStack>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={index} isCurrentPage={index === breadcrumbs.length - 1}>
                  {crumb.href ? (
                    <BreadcrumbLink as={Link} href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <Text color="gray.600">{crumb.label}</Text>
                  )}
                </BreadcrumbItem>
              ))}
            </Breadcrumb>
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              {currentPage}
            </Text>
          </VStack>

          {/* Right side - User Info and Notifications */}
          <HStack spacing={4}>
            {/* Notifications */}
            <Button
              leftIcon={<FiBell />}
              variant="outline"
              size="sm"
              colorScheme={getRoleColor(user.role)}
            >
              Notificações ({notifications})
            </Button>

            {/* User Info */}
            <HStack spacing={3}>
              <Avatar 
                size="sm" 
                name={user.name}
                bg={`${getRoleColor(user.role)}.500`}
              />
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium" color="gray.800">
                  {user.name}
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme={getRoleColor(user.role)} size="sm">
                    {getRoleText(user.role)}
                  </Badge>
                  <Badge colorScheme="green" size="sm">
                    Online
                  </Badge>
                </HStack>
              </VStack>
            </HStack>

            {/* Settings */}
            <IconButton
              aria-label="Configurações"
              icon={<FiSettings />}
              variant="outline"
              size="sm"
            />
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
}
