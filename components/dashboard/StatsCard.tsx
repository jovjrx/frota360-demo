import React from 'react';
import {
  Card,
  HStack,
  VStack,
  Text,
  Icon,
  Box,
} from '@chakra-ui/react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export function StatsCard({ title, value, icon, color, trend, description }: StatsCardProps) {
  const bgColor = 'white';
  const borderColor = 'gray.100';

  return (
    <Card
      p={6}
      bg={bgColor}
      borderRadius="xl"
      boxShadow="sm"
      border="1px"
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={{
        boxShadow: 'md',
        transform: 'translateY(-2px)',
      }}
    >
      <HStack justify="space-between" align="start">
        <VStack align="start" spacing={2} flex={1}>
          <Text fontSize="sm" color="gray.500" fontWeight="medium">
            {title}
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="gray.900">
            {value}
          </Text>
          {trend && (
            <HStack spacing={1}>
              <Icon
                as={trend.isPositive ? FiTrendingUp : FiTrendingDown}
                color={trend.isPositive ? 'green.500' : 'red.500'}
                boxSize={4}
              />
              <Text
                fontSize="sm"
                color={trend.isPositive ? 'green.500' : 'red.500'}
                fontWeight="medium"
              >
                {Math.abs(trend.value)}%
              </Text>
            </HStack>
          )}
          {description && (
            <Text fontSize="xs" color="gray.400">
              {description}
            </Text>
          )}
        </VStack>
        <Box
          p={3}
          bg={`${color}.50`}
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={icon} boxSize={6} color={`${color}.500`} />
        </Box>
      </HStack>
    </Card>
  );
}
