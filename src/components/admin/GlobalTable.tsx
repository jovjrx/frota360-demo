import React from 'react';
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    HStack,
    Badge,
    Text,
    Card,
    CardBody,
    CardHeader,
    Heading,
    useColorModeValue,
    TableContainer,
    VStack,
    Button,
    Icon,
} from '@chakra-ui/react';
import { FiEdit2 } from 'react-icons/fi';

export interface GlobalTableItem {
    id?: string;
    [key: string]: any;
}

export interface GlobalTableBadge {
    label: string;
    colorScheme: string;
    variant?: 'solid' | 'subtle' | 'outline';
}

export interface GlobalTableColumn {
    key: string;
    label: string;
    isNumeric?: boolean;
    width?: string;
    render?: (value: any, item: GlobalTableItem) => React.ReactNode;
}

interface GlobalTableProps<T extends GlobalTableItem> {
    items: T[];
    columns: GlobalTableColumn[];
    badges?: (item: T) => GlobalTableBadge[];
    actions?: (item: T) => React.ReactNode;
    onEdit?: (item: T) => void;
    title?: string;
    subtitle?: string;
    resultLabel?: string;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    size?: 'sm' | 'md' | 'lg';
}

export default function GlobalTable<T extends GlobalTableItem>({
    items,
    columns,
    badges,
    actions,
    onEdit,
    title,
    subtitle,
    resultLabel = 'resultados',
    emptyMessage = 'Nenhum resultado encontrado',
    onRowClick,
    size = 'sm',
}: GlobalTableProps<T>) {
    const headerBg = useColorModeValue('gray.50', 'gray.700');
    const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

    if (items.length === 0) {
        return (
            <Box textAlign="center" py={10} color="gray.500">
                <Text>{emptyMessage}</Text>
            </Box>
        );
    }

    return (
        <Box overflowX="auto" borderRadius="md">
            <TableContainer>
                <Table size={size} variant="striped">
                    <Thead bg={headerBg}>
                        <Tr>
                            {columns.map((column) => (
                                <Th
                                    key={column.key}
                                    isNumeric={column.isNumeric}
                                    width={column.width}
                                    fontSize="xs"
                                    fontWeight="600"
                                    textTransform="uppercase"
                                    letterSpacing="0.05em"
                                    color="gray.600"
                                >
                                    {column.label}
                                </Th>
                            ))}
                            {(badges || actions || onEdit) && (
                                <Th
                                    fontSize="xs"
                                    fontWeight="600"
                                    textTransform="uppercase"
                                    letterSpacing="0.05em"
                                    color="gray.600"
                                    width="100px"
                                >
                                    Ações
                                </Th>
                            )}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {items.map((item) => (
                            <Tr
                                key={item.id}
                                onClick={() => onRowClick?.(item)}
                                cursor={onRowClick ? 'pointer' : 'auto'}
                                _hover={onRowClick ? { bg: rowHoverBg } : {}}
                                transition="background-color 0.2s"
                            >
                                {columns.map((column) => {
                                    const value = item[column.key];
                                    return (
                                        <Td
                                            key={`${item.id}-${column.key}`}
                                            isNumeric={column.isNumeric}
                                            fontSize="sm"
                                            py={3}
                                            px={4}
                                        >
                                            {column.render ? column.render(value, item) : value}
                                        </Td>
                                    );
                                })}
                                {(badges || actions || onEdit) && (
                                    <Td py={3} px={4}>
                                        <HStack spacing={2} justify="flex-start">
                                            {badges && (
                                                <HStack spacing={1}>
                                                    {badges(item).map((badge, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            colorScheme={badge.colorScheme}
                                                            variant={badge.variant || 'subtle'}
                                                            fontSize="xs"
                                                        >
                                                            {badge.label}
                                                        </Badge>
                                                    ))}
                                                </HStack>
                                            )}
                                            {onEdit && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="blue"
                                                    leftIcon={<Icon as={FiEdit2} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit(item);
                                                    }}
                                                >
                                                    Editar
                                                </Button>
                                            )}
                                            {actions && actions(item)}
                                        </HStack>
                                    </Td>
                                )}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
        </Box>
    );
}
