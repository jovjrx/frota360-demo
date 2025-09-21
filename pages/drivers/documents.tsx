import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withDriver } from '@/lib/auth/withDriver';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  Avatar,
  Progress,
  useToast,
  Badge,
  Icon,
  Alert,
  AlertIcon,
  AlertDescription,
  SimpleGrid,
} from '@chakra-ui/react';
import { 
  FiUpload, 
  FiFileText, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiXCircle,
  FiDownload,
  FiEye,
  FiEdit
} from 'react-icons/fi';
import { loadTranslations } from '@/lib/translations';
import StandardLayout from '@/components/layouts/StandardLayout';
import StandardModal from '@/components/modals/StandardModal';
import { useState } from 'react';

interface DriverDocumentsProps {
  driver: any;
  documents: any[];
  translations: Record<string, any>;
  userData: any;
}

export default function DriverDocuments({ 
  driver, 
  documents,
  translations,
  userData
}: DriverDocumentsProps) {
  const tCommon = (key: string) => translations.common?.[key] || key;
  const tDriver = (key: string) => translations.driver?.[key] || key;
  const toast = useToast();
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const getDocumentStatus = (status: string) => {
    switch (status) {
      case 'verified':
        return { color: 'green', icon: FiCheckCircle, text: 'Verificado' };
      case 'pending':
        return { color: 'yellow', icon: FiAlertCircle, text: 'Pendente' };
      case 'rejected':
        return { color: 'red', icon: FiXCircle, text: 'Rejeitado' };
      default:
        return { color: 'gray', icon: FiAlertCircle, text: 'Não enviado' };
    }
  };

  const handleUpload = async (documentType: string, file: File) => {
    try {
      // Implementar upload
      console.log('Uploading document:', documentType, file);
      toast({
        title: 'Documento enviado!',
        description: 'Seu documento foi enviado para análise.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      throw new Error('Erro ao enviar documento');
    }
  };

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    // Implementar visualização
  };

  const handleDownloadDocument = (document: any) => {
    // Implementar download
    console.log('Downloading document:', document);
  };

  const completionPercentage = Math.round(
    (documents.filter(doc => doc.status === 'verified').length / documents.length) * 100
  );

  return (
    <>
      <Head>
        <title>Documentos - Conduz.pt</title>
      </Head>
      
      <StandardLayout
        title="Meus Documentos"
        subtitle="Gerencie sua documentação"
        user={{
          name: driver?.name || 'Motorista',
          avatar: driver?.avatar,
          role: 'driver',
          status: driver?.status
        }}
        notifications={0}
        stats={[
          {
            label: 'Progresso',
            value: `${completionPercentage}%`,
            helpText: 'Documentos verificados',
            color: completionPercentage === 100 ? 'green.500' : 'blue.500'
          },
          {
            label: 'Verificados',
            value: documents.filter(doc => doc.status === 'verified').length,
            helpText: 'de ' + documents.length + ' documentos',
            color: 'green.500'
          },
          {
            label: 'Pendentes',
            value: documents.filter(doc => doc.status === 'pending').length,
            helpText: 'Aguardando análise',
            color: 'yellow.500'
          },
          {
            label: 'Rejeitados',
            value: documents.filter(doc => doc.status === 'rejected').length,
            helpText: 'Precisam de correção',
            color: 'red.500'
          }
        ]}
        actions={
          <Button 
            leftIcon={<FiUpload />} 
            colorScheme="blue"
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Documento
          </Button>
        }
      >
        {/* Progress Overview */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Progresso da Documentação</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">Completude dos Documentos</Text>
                  <Text fontSize="sm" color="gray.600">{completionPercentage}%</Text>
                </HStack>
                <Progress 
                  value={completionPercentage} 
                  colorScheme={completionPercentage === 100 ? 'green' : 'blue'}
                  size="lg"
                  borderRadius="md"
                />
              </Box>
              
              {completionPercentage < 100 && (
                <Alert status="warning">
                  <AlertIcon />
                  <AlertDescription>
                    Complete todos os documentos para começar a trabalhar.
                  </AlertDescription>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Documents List */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {documents.map((document) => {
            const status = getDocumentStatus(document.status);
            const StatusIcon = status.icon;
            
            return (
              <Card key={document.id} bg="white" borderColor="gray.200">
                <CardHeader>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FiFileText} color="blue.500" />
                      <Heading size="sm">{document.name}</Heading>
                    </HStack>
                    <Badge colorScheme={status.color}>
                      {status.text}
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Text fontSize="sm" color="gray.600">
                      {document.description}
                    </Text>
                    
                    {document.status === 'verified' && (
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="green.600">
                          Verificado em {new Date(document.verifiedAt).toLocaleDateString('pt-BR')}
                        </Text>
                        <HStack spacing={2}>
                          <Button size="xs" leftIcon={<FiEye />} variant="outline">
                            Ver
                          </Button>
                          <Button size="xs" leftIcon={<FiDownload />} variant="outline">
                            Baixar
                          </Button>
                        </HStack>
                      </HStack>
                    )}
                    
                    {document.status === 'pending' && (
                      <Text fontSize="xs" color="yellow.600">
                        Enviado em {new Date(document.uploadedAt).toLocaleDateString('pt-BR')} - Aguardando análise
                      </Text>
                    )}
                    
                    {document.status === 'rejected' && (
                      <VStack align="stretch" spacing={2}>
                        <Text fontSize="xs" color="red.600">
                          Rejeitado em {new Date(document.rejectedAt).toLocaleDateString('pt-BR')}
                        </Text>
                        <Text fontSize="xs" color="red.500" fontWeight="medium">
                          Motivo: {document.rejectionReason}
                        </Text>
                        <Button size="xs" leftIcon={<FiUpload />} colorScheme="red" variant="outline">
                          Reenviar
                        </Button>
                      </VStack>
                    )}
                    
                    {document.status === 'not_uploaded' && (
                      <Button size="sm" leftIcon={<FiUpload />} colorScheme="blue" variant="outline">
                        Upload Documento
                      </Button>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>

        {/* Upload Modal */}
        <StandardModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload de Documento"
          onSave={async () => {
            // Implementar upload
            console.log('Upload document');
          }}
          saveText="Enviar Documento"
        >
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              Selecione o tipo de documento e faça o upload do arquivo.
            </Text>
            
            <Box
              border="2px dashed"
              borderColor="gray.300"
              borderRadius="md"
              p={8}
              textAlign="center"
            >
              <Icon as={FiUpload} boxSize={8} color="gray.400" mb={4} />
              <Text fontSize="sm" color="gray.600" mb={2}>
                Arraste o arquivo aqui ou clique para selecionar
              </Text>
              <Text fontSize="xs" color="gray.500">
                Formatos aceitos: PDF, JPG, PNG (máx. 10MB)
              </Text>
            </Box>
          </VStack>
        </StandardModal>
      </StandardLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const translations = await loadTranslations('pt', ['common', 'driver']);

    // Mock data - replace with actual data fetching
    const driver = {
      id: '1',
      name: 'João Silva',
      email: 'joao@example.com',
      status: 'active',
      avatar: null,
    };

    const documents = [
      {
        id: '1',
        name: 'Carta de Condução',
        description: 'Carteira de habilitação válida',
        status: 'verified',
        verifiedAt: '2024-01-15',
        uploadedAt: '2024-01-10',
      },
      {
        id: '2',
        name: 'Seguro do Veículo',
        description: 'Apólice de seguro do veículo',
        status: 'pending',
        uploadedAt: '2024-01-18',
      },
      {
        id: '3',
        name: 'Certificado TVDE',
        description: 'Certificado de transporte de passageiros',
        status: 'rejected',
        uploadedAt: '2024-01-12',
        rejectedAt: '2024-01-14',
        rejectionReason: 'Documento ilegível',
      },
      {
        id: '4',
        name: 'Inspeção Técnica',
        description: 'Certificado de inspeção técnica do veículo',
        status: 'not_uploaded',
      },
    ];

    return {
      props: {
        driver,
        documents,
        translations,
        userData: driver,
      },
    };
  } catch (error) {
    console.error('Error loading driver documents:', error);
    return {
      props: {
        driver: null,
        documents: [],
        translations: { common: {}, driver: {} },
        userData: null,
      },
    };
  }
};