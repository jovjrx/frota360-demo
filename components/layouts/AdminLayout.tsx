'use client';

import React from 'react';
import { Box, Heading, Text, HStack, VStack, Button, Link, Icon } from '@chakra-ui/react';
import { WrapperLayout } from './WrapperLayout';
import { getAllMenuItems, isMenuItemActive } from '@/config/adminMenu';
import { useRouter } from 'next/router';

interface AdminLayoutProps {
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
    admin?: any;
  };
}
export default function AdminLayout({
  children,
  title,
  subtitle,
  side,
  breadcrumbs,
  translations
}: AdminLayoutProps) {
  const router = useRouter();

  // Função de tradução com fallback (usa common para menus)
  const t = (key: string, fallback?: string) => {
    if (!translations?.common) return fallback || key;

    // Navegar pelo objeto de traduções usando o path da chave
    const keys = key.split('.');
    let value: any = translations.common;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }

    return typeof value === 'string' ? value : (fallback || key);
  };

  return (
    <Box minH="100vh" bg="gray.50" position="relative">
      <Box bg="red.900" borderBottom="1px" borderColor="red.800" shadow="sm">
        <WrapperLayout panel>
          <HStack spacing={1} flex={1} justify="flex-start" gap={4} p={2}>
            {getAllMenuItems()?.map((item) => (
              <Button
                key={item.id}
                as={Link}
                href={item.href}
                variant={isMenuItemActive(item.href, router.pathname) ? 'solid' : 'ghost'}
                colorScheme={'whiteAlpha'}
                size="sm"
                textColor={'white'}
                iconSpacing={{ base: 0, md: 2 }}
                leftIcon={<Icon as={item.icon} />}
              >
                <Text display={{ base: 'none', md: 'block' }}>{t(`menu.${item.id}`, item.label)}</Text>
              </Button>
            ))}
          </HStack>
        </WrapperLayout>
      </Box>
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
