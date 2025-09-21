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
import AdminTopBar from './admin/AdminTopBar';

interface StatItem {
  label: string;
  value: string | number;
  helpText?: string;
  arrow?: 'increase' | 'decrease';
  color?: string;
}

interface AdminLayoutProps {
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
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export default function AdminLayout({
  title,
  subtitle,
  user,
  notifications = 0,
  alerts = [],
  stats = [],
  children,
  actions,
  breadcrumbs = []
}: AdminLayoutProps) {
  const bgColor = "gray.50";

  return (
    <>
      <Box minH="100vh" bg={bgColor}>
        {/* Admin Top Bar */}
        <AdminTopBar
          user={user}
          currentPage={title}
          notifications={notifications}
          breadcrumbs={breadcrumbs}
        />

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
            {/* Stats Grid - Always one row on desktop */}
            {stats.length > 0 && (
              <SimpleGrid 
                columns={{ base: 1, md: 2, lg: stats.length > 5 ? 5 : stats.length }} 
                spacing={6}
              >
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
