import React from 'react';
import {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  VStack,
  HStack,
  Box,
  Card,
  CardBody,
  SimpleGrid,
} from '@chakra-ui/react';

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'list' | 'profile' | 'stats';
  count?: number;
}

/**
 * Componente de skeleton loader para diferentes tipos de conteúdo
 * Melhora a UX mostrando um placeholder enquanto dados carregam
 * 
 * @example
 * {isLoading ? (
 *   <SkeletonLoader type="card" count={3} />
 * ) : (
 *   <CardList data={data} />
 * )}
 */
export function SkeletonLoader({ type = 'card', count = 1 }: SkeletonLoaderProps) {
  switch (type) {
    case 'card':
      return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i}>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <Skeleton height="20px" width="60%" />
                  <SkeletonText noOfLines={3} spacing={2} />
                  <Skeleton height="32px" width="40%" />
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      );

    case 'table':
      return (
        <VStack align="stretch" spacing={2}>
          {/* Header */}
          <HStack spacing={4} p={2} bg="gray.50" borderRadius="md">
            <Skeleton height="16px" flex={1} />
            <Skeleton height="16px" flex={1} />
            <Skeleton height="16px" flex={1} />
          </HStack>
          {/* Rows */}
          {Array.from({ length: count }).map((_, i) => (
            <HStack key={i} spacing={4} p={2}>
              <Skeleton height="20px" flex={1} />
              <Skeleton height="20px" flex={1} />
              <Skeleton height="20px" flex={1} />
            </HStack>
          ))}
        </VStack>
      );

    case 'list':
      return (
        <VStack align="stretch" spacing={3}>
          {Array.from({ length: count }).map((_, i) => (
            <HStack key={i} spacing={3}>
              <SkeletonCircle size="10" />
              <VStack align="stretch" flex={1} spacing={2}>
                <Skeleton height="16px" width="70%" />
                <Skeleton height="12px" width="50%" />
              </VStack>
            </HStack>
          ))}
        </VStack>
      );

    case 'profile':
      return (
        <VStack align="stretch" spacing={6}>
          <HStack spacing={4}>
            <SkeletonCircle size="20" />
            <VStack align="stretch" flex={1} spacing={2}>
              <Skeleton height="24px" width="60%" />
              <Skeleton height="16px" width="40%" />
            </VStack>
          </HStack>
          <SkeletonText noOfLines={4} spacing={3} />
        </VStack>
      );

    case 'stats':
      return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i}>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Skeleton height="14px" width="50%" />
                  <Skeleton height="32px" width="80%" />
                  <Skeleton height="12px" width="60%" />
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      );

    default:
      return <Skeleton height="100px" />;
  }
}


