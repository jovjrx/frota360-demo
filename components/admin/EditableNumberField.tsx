import React, { useState, useEffect } from 'react';
import {
  Td,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useEditableControls,
  ButtonGroup,
  IconButton,
  Flex,
  Text,
  useToast,
  HStack,
  VStack,
  Tooltip,
} from '@chakra-ui/react';
import { FiCheck, FiX, FiEdit } from 'react-icons/fi';

interface EditableNumberFieldProps {
  value: number;
  onChange: (newValue: number) => void;
  isPaid: boolean;
  color?: string;
  fontWeight?: 'normal' | 'medium' | 'bold';
  prefix?: string;
  helpText?: string;
}

const EditableNumberField: React.FC<EditableNumberFieldProps> = ({
  value,
  onChange,
  isPaid,
  color,
  fontWeight,
  prefix,
  helpText,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const toast = useToast();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSave = () => {
    if (isPaid) {
      toast({
        title: 'Erro',
        description: 'Não é possível editar um registro pago.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onChange(inputValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(value);
    setIsEditing(false);
  };

  const displayValue = `${prefix || ''}${(inputValue ?? 0).toFixed(2)}`;

  return (
    <Td isNumeric>
      {isEditing ? (
        <HStack spacing={1}>
          <NumberInput
            value={inputValue}
            onChange={(_, val) => setInputValue(val)}
            size="sm"
            maxW="100px"
            precision={2}
            step={0.01}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <ButtonGroup size="xs">
            <IconButton icon={<FiCheck />} onClick={handleSave} aria-label="Salvar" colorScheme="green" />
            <IconButton icon={<FiX />} onClick={handleCancel} aria-label="Cancelar" colorScheme="red" />
          </ButtonGroup>
        </HStack>
      ) : (
        <Flex justify="flex-end" align="center">
          <VStack align="flex-end" spacing={0}>
            <Text 
              color={color} 
              fontWeight={fontWeight}
              mr={2}
            >
              {displayValue}
            </Text>
            {helpText && (
              <Tooltip label={helpText}>
                <Text fontSize="xs" color="gray.500" mr={2}>
                  {helpText}
                </Text>
              </Tooltip>
            )}
          </VStack>
          {!isPaid && (
            <IconButton 
              icon={<FiEdit />} 
              size="xs" 
              variant="ghost" 
              onClick={() => setIsEditing(true)} 
              aria-label="Editar"
            />
          )}
        </Flex>
      )}
    </Td>
  );
};

export default EditableNumberField;

