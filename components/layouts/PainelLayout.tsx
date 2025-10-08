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
  Button,
  Icon,
} from '@chakra-ui/react';
import {
  FiHome,
  FiChevronRight,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  getDashboardMenuItems,
  isDashboardMenuItemActive,
} from '@/config/dashboardMenu';
import { WrapperLayout } from './WrapperLayout';

interface PainelLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  side?: React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export default function PainelLayout({
  children,
  title,
  subtitle,
  side,
  breadcrumbs = []
}: PainelLayoutProps) {
  const router = useRouter();
  const menuItems = getDashboardMenuItems();

  return (
    <Box minH="100vh" bg="gray.50" position='relative'>
      {/* Header */}
      <Box
        bg="green.600"
        position={'sticky'}
        top={0}
        display={{ base: 'none', lg: 'flex' }}
        borderBottom="1px"
        borderColor="green.700"
        shadow="sm"
        zIndex={10}
      >
        <WrapperLayout>
          <HStack spacing={1} flex={1} justify="space-between" gap={4} py={2}>
            {menuItems.map((item) => (
              <Button
                key={item.id}
                as={Link}
                href={item.href}
                variant={isDashboardMenuItemActive(item.href, router.pathname) ? 'solid' : 'ghost'}
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
          <WrapperLayout>
            <Breadcrumb separator={<FiChevronRight color="gray.500" />}>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} href="/painel" fontSize="sm">
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
      <WrapperLayout>
        {(title || side) && (
          <HStack
            mb={6}
            spacing={6}
            align="stretch"
            justify={'center'}
            direction={{ base: 'column', md: 'row' }}
          >
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
          </HStack>
        )}

        <VStack spacing={8} align="stretch">
          {children}
        </VStack>
      </WrapperLayout>
    </Box>
  );
}
