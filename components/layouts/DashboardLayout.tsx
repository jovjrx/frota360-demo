'use client';

import React from 'react';
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Button,
  Link,
  Icon,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import {
  getDashboardMenuItems,
  isDashboardMenuItemActive,
} from '@/config/dashboardMenu';
import { getTranslation } from '@/lib/translations';
import { WrapperLayout } from './WrapperLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  side?: React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  translations?: {
    common?: any;
    dashboard?: any;
  };
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  side,
  breadcrumbs = [],
  translations
}: DashboardLayoutProps) {
  const router = useRouter();
  const menuItems = getDashboardMenuItems();

  // Função de tradução com fallback (usa common para menus)
  const t = (key: string, fallback?: string) => {
    if (!translations?.common) return fallback || key;
    return getTranslation(translations.common, key) || fallback || key;
  };

  return (
    <Box minH="100vh" bg="gray.50" position="relative">
      {/* Header com Menu de Navegação */}
      <Box 
        bg="green.600" 
        borderBottom="1px" 
        borderColor="green.700" 
        shadow="sm"
      >
        <WrapperLayout panel>
          <HStack spacing={1} flex={1} justify="flex-start" gap={4} p={2}>
            {menuItems.map((item) => (
              <Button
                key={item.id}
                as={Link}
                href={item.href}
                variant={isDashboardMenuItemActive(item.href, router.pathname) ? 'solid' : 'ghost'}
                colorScheme={'whiteAlpha'}
                size="sm"
                textColor={'white'}
                iconSpacing={{base: 0, md: 2}}
                leftIcon={<Icon as={item.icon} />}
              >
                <Text display={{ base: 'none', md: 'block' }}>{t(`menu.${item.id}`, item.label)}</Text>
              </Button>
            ))}
          </HStack>
        </WrapperLayout>
      </Box>

      {/* Conteúdo Principal */}
      <WrapperLayout panel py={4}>
        {(title || side) && (
          <HStack
            mb={4}
            spacing={2}
            align={{ base: 'stretch', md: 'center' }}
            justify="space-between"
            direction={{ base: 'column', md: 'row' }}
          >
            {title && (
              <VStack align="start" spacing={1} flexGrow={1}>
                <Heading size="md" mb={0} color="gray.700">
                  {title}
                </Heading>
                {subtitle && (
                  <Text color="gray.600" fontSize="sm">
                    {subtitle}
                  </Text>
                )}
              </VStack>
            )}
            {side && <Box flexShrink={0}>{side}</Box>}
          </HStack>
        )}

        <VStack spacing={4} align="stretch">
          {children}
        </VStack>
      </WrapperLayout>
    </Box>
  );
}
