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
  isDashboardMenuGroupActive,
} from '@/config/dashboardMenu';
import { getTranslation } from '@/lib/translations';
import { WrapperLayout } from './WrapperLayout';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  side?: React.ReactNode;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
  translations?: {
    common?: any;
    dashboard?: any;
  };
  driverType?: 'affiliate' | 'renter';
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  side,
  breadcrumbs = [],
  translations,
  driverType = 'affiliate'
}: DashboardLayoutProps) {
  const router = useRouter();
  let menuItems = getDashboardMenuItems();
  
  // Adicionar tracking só para locatários (renters)
  if (driverType === 'renter') {
    // Importar tracking item se necessário
    const trackingItem = {
      id: 'tracking',
      label: 'tracking',
      href: '/dashboard/tracking',
      icon: require('react-icons/fi').FiMapPin,
    };
    // Adicionar antes do profile
    const profileIndex = menuItems.findIndex(item => item.id === 'profile');
    if (profileIndex > -1) {
      menuItems = [
        ...menuItems.slice(0, profileIndex),
        trackingItem,
        ...menuItems.slice(profileIndex)
      ];
    }
  }

  // Função de tradução com fallback (usa common para menus)
  const t = (key: string, fallback?: string) => {
    if (!translations?.common) return fallback || key;
    return getTranslation(translations.common, key) || fallback || key;
  };

  return (
    <Box minH="100vh" bg="gray.50" position="relative">
      {/* Header com Menu de Navegação */}
      <Box 
        bg="blue.500" 
        borderBottom="1px" 
        borderColor="blue.400" 
        shadow="sm"
      >
        <WrapperLayout panel>
          <VStack align="stretch" spacing={0}>
            <HStack spacing={1} flex={1} justify="flex-start" gap={4} p={2}>
              {menuItems.map((item) => (
                <Box key={item.id} position="relative" _hover={item.subItems?.length ? { '& > div:last-child': { display: 'flex' } } : undefined}>
                  {item.href ? (
                    <Button
                      as={Link}
                      href={item.href}
                      variant={isDashboardMenuGroupActive(item, router.pathname) ? 'solid' : 'ghost'}
                      colorScheme={'whiteAlpha'}
                      size="sm"
                      textColor={'white'}
                      iconSpacing={{base: 0, md: 2}}
                      leftIcon={<Icon as={item.icon} />}
                    >
                      <Text display={{ base: 'none', md: 'block' }}>{t(`menu.${item.id}`, item.label)}</Text>
                    </Button>
                  ) : (
                    <Button
                      variant={isDashboardMenuGroupActive(item, router.pathname) ? 'solid' : 'ghost'}
                      colorScheme={'whiteAlpha'}
                      size="sm"
                      textColor={'white'}
                      iconSpacing={{base: 0, md: 2}}
                      leftIcon={<Icon as={item.icon} />}
                      cursor="default"
                    >
                      <Text display={{ base: 'none', md: 'block' }}>{t(`menu.${item.id}`, item.label)}</Text>
                    </Button>
                  )}
                  
                  {/* Submenu */}
                  {item.subItems && item.subItems.length > 0 && (
                    <VStack
                      position="absolute"
                      top="100%"
                      left={0}
                      bg="blue.600"
                      borderRadius="md"
                      shadow="lg"
                      minW="150px"
                      py={1}
                      display="none"
                      zIndex={10}
                      spacing={0}
                    >
                      {item.subItems.map((subItem) => (
                        <Button
                          key={subItem.id}
                          as={Link}
                          href={subItem.href}
                          variant={isDashboardMenuItemActive(subItem.href, router.pathname) ? 'solid' : 'ghost'}
                          colorScheme={'whiteAlpha'}
                          size="sm"
                          textColor={'white'}
                          width="100%"
                          justifyContent="flex-start"
                          borderRadius={0}
                          _first={{ borderTopRadius: 'md' }}
                          _last={{ borderBottomRadius: 'md' }}
                          fontSize="sm"
                        >
                          {t(`menu.${subItem.id}`, subItem.label)}
                        </Button>
                      ))}
                    </VStack>
                  )}
                </Box>
              ))}
            </HStack>
          </VStack>
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

