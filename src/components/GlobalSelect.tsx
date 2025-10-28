import { ReactNode } from 'react';
import {
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Icon,
    HStack,
    VStack,
    Text,
    Badge,
} from '@chakra-ui/react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

export interface SelectOption {
    id: string;
    label: string;
    description?: string;
    badge?: {
        text: string;
        colorScheme: string;
    };
    icon?: ReactNode;
    [key: string]: any;
}

export interface GlobalSelectProps {
    options: SelectOption[];
    selectedId?: string;
    onChange: (id: string) => void;
    placeholder?: string;
    buttonLabel?: string | ((option: SelectOption | undefined) => ReactNode);
    size?: 'sm' | 'md' | 'lg';
}

export function GlobalSelect({
    options,
    selectedId,
    onChange,
    placeholder = 'Selecionar',
    buttonLabel,
    size = 'sm',
}: GlobalSelectProps) {
    const selectedOption = options.find((opt) => opt.id === selectedId);

    const getButtonLabel = () => {
        if (typeof buttonLabel === 'function') {
            return buttonLabel(selectedOption);
        }
        return buttonLabel || selectedOption?.label || placeholder;
    };

    return (
        <Menu>
            <MenuButton 
                as={Button} 
                rightIcon={<Icon as={FiChevronDown} />} 
                size={size} 
                minW="240px" 
                width="full" 
                variant="solid"
                colorScheme="white"
                bg="white"
                color="gray.900"
                borderWidth="1px"
                borderColor="gray.300"
                _hover={{
                    bg: 'gray.50',
                    borderColor: 'gray.400',
                }}
                _active={{
                    bg: 'white',
                    borderColor: 'gray.400',
                }}
                _focus={{
                    boxShadow: '0 0 0 3px rgba(66, 133, 244, 0.1)',
                }}
            >
                {getButtonLabel()}
            </MenuButton>
            <MenuList maxH="60vh" overflowY="auto">
                {options.map((option) => {
                    const isSelected = option.id === selectedId;
                    return (
                        <MenuItem 
                            key={option.id} 
                            onClick={() => onChange(option.id)} 
                            p={3} 
                            bg={isSelected ? 'blue.50' : 'white'}
                            borderLeft={isSelected ? '3px solid' : '3px solid transparent'}
                            borderLeftColor={isSelected ? 'blue.500' : 'transparent'}
                            _hover={{ 
                                bg: isSelected ? 'blue.100' : 'gray.50',
                            }}
                        >
                            <VStack align="start" spacing={1} width="full">
                                <HStack width="full" justify="space-between" spacing={2}>
                                    <HStack spacing={2} flex={1}>
                                        {option.icon && option.icon}
                                        <Text fontSize="sm" fontWeight={isSelected ? 'bold' : 'medium'}>
                                            {option.label}
                                        </Text>
                                    </HStack>
                                    <HStack spacing={2} flexShrink={0}>
                                        {option.badge && (
                                            <Badge colorScheme={option.badge.colorScheme} fontSize="xs">
                                                {option.badge.text}
                                            </Badge>
                                        )}
                                        {isSelected && (
                                            <Icon as={FiCheck} color="blue.500" fontWeight="bold" />
                                        )}
                                    </HStack>
                                </HStack>
                                {option.description && (
                                    <Text fontSize="xs" color="gray.600" pl={option.icon ? 6 : 0}>
                                        {option.description}
                                    </Text>
                                )}
                            </VStack>
                        </MenuItem>
                    );
                })}
            </MenuList>
        </Menu>
    );
}
