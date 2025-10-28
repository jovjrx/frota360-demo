import React from 'react';
import { Box, HStack, VStack, Text, Badge } from '@chakra-ui/react';

export interface GlobalListItem {
  id: string;
  [key: string]: any;
}

export interface GlobalListBadge {
  label: string;
  colorScheme: string;
}

export interface GlobalListAction {
  icon?: React.ComponentType;
  label?: string;
  onClick?: () => void;
  [key: string]: any;
}

export interface GlobalListColumn {
  key: string;
  label?: string;
  render?: (item: GlobalListItem) => React.ReactNode;
}

interface GlobalListProps<T extends GlobalListItem> {
  items: T[];
  primaryColumn: GlobalListColumn;
  secondaryColumns?: GlobalListColumn[];
  badges?: (item: T) => Array<{ label: string; colorScheme: string }>;
  actions?: (item: T) => React.ReactNode;
  resultLabel?: string;
  maxHeight?: string;
}

export default function GlobalList<T extends GlobalListItem>({
  items,
  primaryColumn,
  secondaryColumns = [],
  badges,
  actions,
  resultLabel = 'resultados',
  maxHeight = '600px',
}: GlobalListProps<T>) {
  return (
    <Box overflowX="auto" maxH={maxHeight} overflowY="auto">
      <Text fontSize="sm" color="gray.600" mb={2}>
        {items.length} {resultLabel}
      </Text>

      {items.map((item) => (
        <Box
          key={item.id}
          p={3}
          mb={2}
          bg="white"
          borderWidth={1}
          borderRadius="md"
          _hover={{ bg: 'gray.50' }}
        >
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold">
                {primaryColumn.render
                  ? primaryColumn.render(item)
                  : (item[primaryColumn.key] as string)}
              </Text>

              {(badges || secondaryColumns.length > 0) && (
                <VStack align="start" spacing={1} w="100%">
                  {badges && (
                    <HStack spacing={2} wrap="wrap">
                      {badges(item).map((badge, idx) => (
                        <Badge key={idx} colorScheme={badge.colorScheme}>
                          {badge.label}
                        </Badge>
                      ))}
                    </HStack>
                  )}

                  {secondaryColumns.map((col, idx) => (
                    <Text key={idx} fontSize="xs" color="gray.600">
                      {col.render ? col.render(item) : (item[col.key] as string)}
                    </Text>
                  ))}
                </VStack>
              )}
            </VStack>

            {actions && <HStack spacing={2}>{actions(item)}</HStack>}
          </HStack>
        </Box>
      ))}
    </Box>
  );
}

