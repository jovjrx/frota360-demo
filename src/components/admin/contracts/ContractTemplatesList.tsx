import {
  Card,
  CardBody,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  ButtonGroup,
  Icon,
  Box,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { FiFileText, FiDownload, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';
import type { ContractTemplate } from '@/schemas/contract-template';

interface TemplateWithUrl extends ContractTemplate {
  downloadUrl?: string;
}

interface ContractTemplatesListProps {
  templates: TemplateWithUrl[];
  isLoading?: boolean;
  onTemplatesChange?: () => void;
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function ContractTemplatesList({ templates, isLoading = false, onTemplatesChange }: ContractTemplatesListProps) {
  const toast = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (templateId: string) => {
    try {
      const confirmDelete = window.confirm('Tem certeza que deseja remover este modelo?');
      if (!confirmDelete) {
        return;
      }

      setDeletingId(templateId);
      const response = await fetch(`/api/admin/contracts/templates/${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error ?? 'Erro ao remover modelo');
      }

      toast({
        title: 'Modelo removido',
        status: 'success',
        duration: 3000,
      });
      onTemplatesChange?.();
    } catch (error: any) {
      console.error('[Contracts] Failed to delete template:', error);
      toast({
        title: 'Erro ao remover modelo',
        description: error?.message ?? 'Tente novamente mais tarde.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card variant="outline">
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <HStack spacing={3}>
            <Icon as={FiFileText} boxSize={6} color="purple.500" />
            <VStack align="start" spacing={0}>
              <Heading size="sm">Modelos cadastrados</Heading>
              <Text fontSize="sm" color="gray.600">
                Controle de versões disponíveis para download pelos motoristas.
              </Text>
            </VStack>
          </HStack>

          {isLoading ? (
            <HStack justify="center" py={8}>
              <Spinner />
              <Text fontSize="sm" color="gray.600">Carregando modelos...</Text>
            </HStack>
          ) : templates.length === 0 ? (
            <Box borderWidth="1px" borderRadius="lg" p={6} textAlign="center" color="gray.500">
              <Text fontWeight="semibold">Nenhum modelo cadastrado</Text>
              <Text fontSize="sm">Envie um PDF para começar.</Text>
            </Box>
          ) : (
            <VStack spacing={3} align="stretch">
              {templates.map((template) => (
                <HStack
                  key={template.id}
                  justify="space-between"
                  align={{ base: 'flex-start', md: 'center' }}
                  spacing={3}
                  borderWidth="1px"
                  borderRadius="lg"
                  p={4}
                  flexWrap="wrap"
                >
                  <VStack align="start" spacing={1} flex={1} minW={{ base: '100%', md: '50%' }}>
                    <HStack spacing={2}>
                      <Badge colorScheme={template.type === 'affiliate' ? 'blue' : 'purple'}>
                        {template.type === 'affiliate' ? 'Afiliado' : 'Locatário'}
                      </Badge>
                      {template.isActive ? <Badge colorScheme="green">Ativo</Badge> : <Badge>Inativo</Badge>}
                    </HStack>
                    <Text fontWeight="semibold">Versão {template.version}</Text>
                    <Text fontSize="sm" color="gray.600">
                      Enviado por {template.uploadedBy ?? '—'} em {formatDate(template.uploadedAt)}
                    </Text>
                  </VStack>

                  <ButtonGroup spacing={2}>
                    {template.downloadUrl && (
                      <Button
                        as="a"
                        href={template.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        leftIcon={<FiDownload />}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                      >
                        Baixar
                      </Button>
                    )}
                    <Button
                      leftIcon={<FiTrash2 />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDelete(template.id)}
                      isLoading={deletingId === template.id}
                    >
                      Remover
                    </Button>
                  </ButtonGroup>
                </HStack>
              ))}
            </VStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

