import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  Stack,
  Text,
  Button,
  Badge,
  HStack,
  VStack,
  useToast,
  Icon,
  SimpleGrid,
  Checkbox,
} from '@chakra-ui/react';
import { FiDownload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { DocumentDriverView } from '@/schemas/document';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr/withDashboardSSR';

interface DocumentsPageProps extends DashboardPageProps {
  documents: DocumentDriverView[];
  motorista?: any;
}

export default function DriverDocumentsPage({ user, locale, translations, documents, motorista }: DocumentsPageProps) {
  const [acknowledgedDocs, setAcknowledgedDocs] = useState<Set<string>>(
    new Set(documents.filter(d => d.acknowledgedAt).map(d => d.id))
  );
  const toast = useToast();

  const handleAcknowledge = async (docId: string) => {
    try {
      const res = await fetch(`/api/driver/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      });

      const data = await res.json();
      if (data.success) {
        setAcknowledgedDocs(new Set([...acknowledgedDocs, docId]));
        toast({ status: 'success', title: 'Documento reconhecido com sucesso' });
      } else {
        toast({ status: 'error', title: data.error || 'Erro ao reconhecer' });
      }
    } catch (e) {
      toast({ status: 'error', title: 'Erro ao reconhecer documento' });
    }
  };

  const getCategoryLabel = (cat: string): string => {
    const labels: Record<string, string> = {
      insurance: 'Seguro',
      tax: 'Fiscal',
      compliance: 'Conformidade',
      safety: 'Segurança',
      other: 'Outro',
    };
    return labels[cat] || cat;
  };

  const requiredNotAcknowledged = documents.filter(
    d => d.isRequired && !acknowledgedDocs.has(d.id)
  );

  return (
    <DashboardLayout
      title="Documentos"
      subtitle="Visualizar documentos e políticas"
      breadcrumbs={[{ label: 'Documentos' }]}
      translations={translations}
      driverType={motorista?.type}
    >
      {/* Alert de documentos obrigatórios não reconhecidos */}
      {requiredNotAcknowledged.length > 0 && (
        <Card mb={4} borderWidth="1px" borderColor="orange.300" bg="orange.50">
          <CardBody>
            <HStack spacing={3}>
              <Icon as={FiAlertCircle} color="orange.500" boxSize={5} />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" color="orange.900">
                  {requiredNotAcknowledged.length} documento(s) obrigatório(s) aguardando reconhecimento
                </Text>
                <Text fontSize="sm" color="orange.800">
                  Por favor, revise e reconheça os documentos obrigatórios abaixo
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Lista de documentos */}
      <Stack spacing={4}>
        {documents.length === 0 ? (
          <Card>
            <CardBody textAlign="center" py={8} color="gray.500">
              <Text>Nenhum documento disponível no momento</Text>
            </CardBody>
          </Card>
        ) : (
          documents.map(doc => (
            <Card
              key={doc.id}
              borderWidth={doc.isRequired && !acknowledgedDocs.has(doc.id) ? '2px' : '1px'}
              borderColor={doc.isRequired && !acknowledgedDocs.has(doc.id) ? 'orange.300' : 'gray.200'}
              bg={doc.isExpired ? 'gray.50' : 'white'}
            >
              <CardBody>
                <VStack align="start" spacing={3}>
                  {/* Cabeçalho */}
                  <HStack justify="space-between" w="full">
                    <VStack align="start" spacing={1}>
                      <HStack spacing={2}>
                        <Text fontWeight="bold" fontSize="lg">
                          {doc.name}
                        </Text>
                        {doc.isRequired && (
                          <Badge colorScheme="red">Obrigatório</Badge>
                        )}
                        {acknowledgedDocs.has(doc.id) && (
                          <Badge colorScheme="green" display="flex" alignItems="center" gap={1}>
                            <Icon as={FiCheckCircle} boxSize={3} />
                            Reconhecido
                          </Badge>
                        )}
                        {doc.isExpired && (
                          <Badge colorScheme="red">Expirado</Badge>
                        )}
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {getCategoryLabel(doc.category)}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Descrição */}
                  {doc.description && (
                    <Text fontSize="sm" color="gray.700">
                      {doc.description}
                    </Text>
                  )}

                  {/* Info de validade */}
                  <HStack spacing={4} fontSize="sm" color="gray.600">
                    {doc.validFrom && (
                      <Text>Válido a partir de: {new Date(doc.validFrom).toLocaleDateString('pt-PT')}</Text>
                    )}
                    {doc.validUntil && (
                      <Text fontWeight={doc.isExpired ? 'bold' : 'normal'} color={doc.isExpired ? 'red.600' : 'gray.600'}>
                        Expira em: {new Date(doc.validUntil).toLocaleDateString('pt-PT')}
                        {doc.expiresInDays !== null && ` (${doc.expiresInDays} dias)`}
                      </Text>
                    )}
                  </HStack>

                  {/* Botões */}
                  <HStack spacing={3}>
                    <Button
                      leftIcon={<FiDownload />}
                      colorScheme="blue"
                      variant="outline"
                      size="sm"
                      as="a"
                      href={doc.fileUrl}
                      target="_blank"
                    >
                      Download
                    </Button>

                    {doc.isRequired && !acknowledgedDocs.has(doc.id) && !doc.isExpired && (
                      <Button
                        colorScheme="orange"
                        size="sm"
                        onClick={() => handleAcknowledge(doc.id)}
                      >
                        Reconhecer Recebimento
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))
        )}
      </Stack>
    </DashboardLayout>
  );
}

export const getServerSideProps = withDashboardSSR<{ documents: DocumentDriverView[] }>(
  {},
  async (_context, _user, driverId) => {
    try {
      const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/driver/documents?driverId=${driverId}`);
      const data = await res.json();

      return {
        documents: data.data || [],
      };
    } catch (error) {
      console.error('[driver/documents] SSR error:', error);
      return {
        documents: [],
      };
    }
  }
);

