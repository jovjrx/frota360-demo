'use client';

import React from 'react';
import { Box, Heading, Text, HStack, VStack } from '@chakra-ui/react';
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
  breadcrumbs,
}: AdminLayoutProps) {
  return (
    <Box minH="100vh" bg="gray.50" position="relative">
      <WrapperLayout panel>
        {(title || side) && (
          <HStack
            mb={6}
            spacing={6}
            align={{ base: 'stretch', md: 'center' }}
            justify="space-between"
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
            {side && <Box flexShrink={0}>{side}</Box>}
          </HStack>
        )}

        <VStack spacing={8} align="stretch">
          {children}
        </VStack>
      </WrapperLayout>
    </Box>
  );
}
