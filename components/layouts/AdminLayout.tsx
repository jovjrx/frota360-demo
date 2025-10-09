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
}
export default function AdminLayout({
  children,
  title,
  subtitle,
  side,
  breadcrumbs,
}: AdminLayoutProps) {
  const router = useRouter();
  return (
    <Box minH="100vh" bg="gray.50" position="relative">
         <Box bg="red.900" display={{ base: 'none', lg: 'flex' }} borderBottom="1px" borderColor="red.800" shadow="sm">
        <WrapperLayout panel>
          <HStack spacing={1} flex={1} justify="space-between" gap={4} p={1}>
            {getAllMenuItems()?.map((item) => (
              <Button
                key={item.id}
                as={Link}
                href={item.href}
                variant={isMenuItemActive(item.href, router.pathname) ? 'solid' : 'ghost'}
                colorScheme={'whiteAlpha'}
                size="xs"
                textColor={'white'}
                leftIcon={<Icon as={item.icon} />}
              >
                {item.label}
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
