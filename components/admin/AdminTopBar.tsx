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

interface AdminTopBarProps {
  user: {
    name: string;
    avatar?: string;
    role: string;
  };
  currentPage: string;
  notifications?: number;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export default function AdminTopBar({
  user,
  currentPage,
  notifications = 0,
  breadcrumbs = []
}: AdminTopBarProps) {
  return (
    <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4} shadow="sm">
      <Box maxW="7xl" mx="auto" px={4}>
        <HStack justifyContent="space-between" alignItems="center">
          {/* Left side - Breadcrumbs and Page Info */}
          <VStack align="flex-start" spacing={1}>
            <Breadcrumb separator={<FiChevronRight size={12} />} fontSize="sm">
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} href="/admin">
                  <HStack spacing={1}>
                    <FiHome size={14} />
                    <Text>Admin</Text>
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
              colorScheme="blue"
            >
              Notificações ({notifications})
            </Button>

            {/* User Info */}
            <HStack spacing={3}>
              <Avatar 
                size="sm" 
                name={user.name}
                bg="blue.500"
              />
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium" color="gray.800">
                  {user.name}
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme="blue" size="sm">
                    {user.role === 'admin' ? 'Administrador' : user.role}
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
