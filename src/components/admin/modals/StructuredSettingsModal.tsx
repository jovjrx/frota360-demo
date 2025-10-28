import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Select,
  FormHelperText,
  Divider,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
  Center,
} from '@chakra-ui/react';

interface StructuredSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  sections: Array<{
    title?: string;
    description?: string;
    fields: Array<{
      name: string;
      label: string;
      type: 'text' | 'number' | 'select' | 'textarea';
      value: any;
      onChange: (value: any) => void;
      placeholder?: string;
      helperText?: string;
      options?: Array<{ label: string; value: any }>;
      min?: number;
      max?: number;
      step?: number;
    }>;
  }>;
  isLoading?: boolean;
  isSaving?: boolean;
  onSave: () => Promise<void>;
  error?: string | null;
  successMessage?: string;
}

export default function StructuredSettingsModal({
  isOpen,
  onClose,
  title,
  description,
  sections,
  isLoading = false,
  isSaving = false,
  onSave,
  error,
}: StructuredSettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={!isSaving}>
      <ModalOverlay />
      <ModalContent>
        {/* Header */}
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Heading size="md">{title}</Heading>
            {description && <Text fontSize="sm" color="gray.600">{description}</Text>}
          </VStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isSaving} />

        {/* Body */}
        <ModalBody>
          {isLoading ? (
            <Center py={8}>
              <Spinner size="lg" />
            </Center>
          ) : (
            <Stack spacing={6}>
              {/* Error Alert */}
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              {/* Sections */}
              {sections.map((section, sectionIdx) => (
                <VStack key={sectionIdx} align="stretch" spacing={4}>
                  {/* Section Title */}
                  {section.title && (
                    <VStack align="start" spacing={1}>
                      <Heading size="sm">{section.title}</Heading>
                      {section.description && (
                        <Text fontSize="xs" color="gray.600">{section.description}</Text>
                      )}
                    </VStack>
                  )}

                  {/* Fields */}
                  <Stack spacing={3}>
                    {section.fields.map((field, fieldIdx) => (
                      <FormControl key={fieldIdx}>
                        <FormLabel fontSize="sm">{field.label}</FormLabel>

                        {field.type === 'text' && (
                          <Input
                            type="text"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder={field.placeholder}
                            isDisabled={isSaving}
                          />
                        )}

                        {field.type === 'number' && (
                          <Input
                            type="number"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder={field.placeholder}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            isDisabled={isSaving}
                          />
                        )}

                        {field.type === 'select' && (
                          <Select
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            isDisabled={isSaving}
                          >
                            <option value="">Selecione...</option>
                            {field.options?.map((opt, optIdx) => (
                              <option key={optIdx} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </Select>
                        )}

                        {field.type === 'textarea' && (
                          <Input
                            as="textarea"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder={field.placeholder}
                            isDisabled={isSaving}
                          />
                        )}

                        {field.helperText && (
                          <FormHelperText fontSize="xs">{field.helperText}</FormHelperText>
                        )}
                      </FormControl>
                    ))}
                  </Stack>

                  {/* Divider between sections */}
                  {sectionIdx < sections.length - 1 && <Divider my={2} />}
                </VStack>
              ))}
            </Stack>
          )}
        </ModalBody>

        {/* Footer */}
        <ModalFooter>
          <HStack spacing={3}>
            <Button
              variant="ghost"
              onClick={onClose}
              isDisabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={onSave}
              isLoading={isSaving}
              isDisabled={isLoading}
            >
              Salvar Configuração
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

