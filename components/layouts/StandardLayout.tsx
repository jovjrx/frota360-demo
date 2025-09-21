import React from 'react';
import Head from 'next/head';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import { FiBell, FiSettings } from 'react-icons/fi';

interface StatItem {
  label: string;
  value: string | number;
  helpText?: string;
  arrow?: 'increase' | 'decrease';
  color?: string;
}

interface StandardLayoutProps {
  title: string;
  subtitle?: string;
  user: {
    name: string;
    avatar?: string;
    role: 'admin' | 'driver';
    status?: string;
  };
  notifications?: number;
  alerts?: Array<{
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    description: string;
  }>;
  stats?: StatItem[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function StandardLayout({
  title,
  subtitle,
  user,
  notifications = 0,
  alerts = [],
  stats = [],
  children,
  actions,
}: StandardLayoutProps) {
  const bgColor = "gray.50";

  const getStatusColor = (status?: string) => {
    if (!status) return 'gray';
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'yellow';
      case 'suspended': return 'red';
      case 'inactive': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusText = (status?: string) => {
    if (!status) return 'Desconhecido';
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'suspended': return 'Suspenso';
      case 'inactive': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'blue';
      case 'driver': return 'green';
      default: return 'gray';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'driver': return 'Motorista';
      default: return 'Usuário';
    }
  };

  return (
    <>
      <Box minH="100vh" bg={bgColor}>
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4} shadow="sm">
          <Box maxW="7xl" mx="auto" px={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <HStack spacing={4}>
                <Avatar 
                  size="md" 
                  name={user.name} 
                  src={user.avatar}
                  bg={user.role === 'admin' ? 'blue.500' : 'green.500'}
                />
                <VStack align="flex-start" spacing={0}>
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    {title}
                  </Text>
                  {subtitle && (
                    <Text fontSize="sm" color="gray.600">
                      {subtitle}
                    </Text>
                  )}
                  <HStack>
                    <Badge colorScheme={getRoleColor(user.role)}>
                      {getRoleText(user.role)}
                    </Badge>
                    {user.status && (
                      <Badge colorScheme={getStatusColor(user.status)}>
                        {getStatusText(user.status)}
                      </Badge>
                    )}
                  </HStack>
                </VStack>
              </HStack>
              <HStack spacing={4}>
                {actions}
                <Button leftIcon={<FiBell />} variant="outline" size="sm">
                  Notificações ({notifications})
                </Button>
                <Button leftIcon={<FiSettings />} variant="outline" size="sm">
                  Configurações
                </Button>
              </HStack>
            </HStack>
          </Box>
        </Box>

        {/* Status Alerts */}
        {alerts.map((alert, index) => (
          <Box key={index} maxW="7xl" mx="auto" px={4} pt={4}>
            <Alert status={alert.type} borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>
                  {alert.description}
                </AlertDescription>
              </Box>
            </Alert>
          </Box>
        ))}

        {/* Main Content */}
        <Box maxW="7xl" mx="auto" px={4} py={8}>
          <VStack spacing={8} align="stretch">
            {/* Stats Grid */}
            {stats.length > 0 && (
              <SimpleGrid columns={{ base: 1, md: 2, lg: stats.length > 4 ? 4 : stats.length }} spacing={6}>
                {stats.map((stat, index) => (
                  <Card key={index} bg="white" borderColor="gray.200">
                    <CardBody>
                      <Stat>
                        <StatLabel>{stat.label}</StatLabel>
                        <StatNumber color={stat.color}>{stat.value}</StatNumber>
                        {stat.helpText && (
                          <StatHelpText>
                            {stat.arrow && <StatArrow type={stat.arrow} />}
                            {stat.helpText}
                          </StatHelpText>
                        )}
                      </Stat>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}

            {/* Page Content */}
            {children}
          </VStack>
        </Box>
      </Box>
    </>
  );
}
