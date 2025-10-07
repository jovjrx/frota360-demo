'use client';

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
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  IconButton,
  Icon,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  FiHome,
  FiChevronRight,
  FiGrid,
  FiChevronDown,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  getMainMenuItems,
  getMoreMenuItems,
  getAllMenuItems,
  isMenuItemActive,
} from '@/config/adminMenu';
import { WrapperLayout } from './WrapperLayout';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  side?: React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export default function AdminLayout({
  children,
  title,
  subtitle,
  side,
  breadcrumbs = []
}: AdminLayoutProps) {
  const router = useRouter();
  const allMenuItems = getAllMenuItems();

  return (
    <Box minH="100vh" bg="gray.50" position='relative'>
      {/* Header */}
      <Box bg="red.900" display={{ base: 'none', lg: 'flex' }} borderBottom="1px" borderColor="red.800" shadow="sm">
        <WrapperLayout panel>
          <HStack spacing={1} flex={1} justify="space-between" gap={4} py={2}>
            {allMenuItems.map((item) => (
              <Button
                key={item.id}
                as={Link}
                href={item.href}
                variant={isMenuItemActive(item.href, router.pathname) ? 'solid' : 'ghost'}
                colorScheme={'whiteAlpha'}
                size="sm"
                textColor={'white'}
                leftIcon={<Icon as={item.icon} />}
              >
                {item.label}
              </Button>
            ))}
          </HStack>
        </WrapperLayout>
      </Box>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Box bg="white" borderBottom="1px" borderColor="gray.100" py={3}>
          <WrapperLayout panel>
            <Breadcrumb separator={<FiChevronRight color="gray.500" />}>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} href="/admin" fontSize="sm">
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
          </WrapperLayout>
        </Box>
      )}

      {/* Conteúdo Principal */}
      <WrapperLayout panel>
        {(title || side) && <HStack mb={6} spacing={6} align="stretch" justify={'center'} direction={{ base: 'column', md: 'row' }}>
          {title && (
            <VStack align="start" spacing={1} flexGrow={1}>
              <Heading size="lg" mb={0} color="gray.900">
                {title}
              </Heading>
              {subtitle && (
                <Text color="gray.600" fontSize="md">
                  {subtitle}
                </Text>
              )}
            </VStack>
          )}
          {side && (
            <Box flexShrink={0}>
              {side}
            </Box>
          )}
        </HStack>}

        <VStack spacing={8} align="stretch">
          {/* Conteúdo */}
          {children}
        </VStack>
      </WrapperLayout>
    </Box>
  );
}
