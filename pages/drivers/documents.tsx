import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withDriver } from '@/lib/auth/withDriver';
import { adminDb } from '@/lib/firebaseAdmin';
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
  FormControl,
  FormLabel,
  Input,
  Select,
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
import DriverLayout from '@/components/layouts/DriverLayout';
import StandardModal from '@/components/modals/StandardModal';
import { useState } from 'react';
import { formatPortugalTime } from '@/lib/timezone';

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
        return { color: 'green', icon: FiCheckCircle, text: tDriver('documents.status.verified') };
      case 'pending':
        return { color: 'yellow', icon: FiAlertCircle, text: tDriver('documents.status.pending') };
      case 'rejected':
        return { color: 'red', icon: FiXCircle, text: tDriver('documents.status.rejected') };
      default:
        return { color: 'gray', icon: FiAlertCircle, text: tDriver('documents.status.notUploaded') };
    }
  };

  const handleUpload = async (documentType: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('driverId', driver?.id);

      const response = await fetch('/api/drivers/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha no upload');
      }

      toast({
        title: 'Documento enviado!',
        description: 'Seu documento foi enviado para análise.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reload page to show updated documents
      window.location.reload();
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Não foi possível enviar o documento.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
        <title>{`${tDriver('documents.title')} - Conduz.pt`}</title>
      </Head>
      
      <DriverLayout
        title={tDriver('documents.title')}
        subtitle={tDriver('documents.subtitle')}
        user={{
          name: driver?.name || 'Motorista',
          avatar: driver?.avatar,
          role: 'driver',
          status: driver?.status
        }}
        notifications={0}
        stats={[
          {
            label: tDriver('documents.progress'),
            value: `${completionPercentage}%`,
            helpText: tDriver('documents.verified'),
            color: completionPercentage === 100 ? 'green.500' : 'blue.500'
          },
          {
            label: tDriver('documents.verified'),
            value: documents.filter(doc => doc.status === 'verified').length,
            helpText: tDriver('documents.verifiedCount').replace('{{total}}', documents.length.toString()),
            color: 'green.500'
          },
          {
            label: tDriver('documents.pending'),
            value: documents.filter(doc => doc.status === 'pending').length,
            helpText: tDriver('documents.awaitingAnalysis'),
            color: 'yellow.500'
          },
          {
            label: tDriver('documents.rejected'),
            value: documents.filter(doc => doc.status === 'rejected').length,
            helpText: tDriver('documents.needCorrection'),
            color: 'red.500'
          }
        ]}
        actions={
          <Button 
            leftIcon={<FiUpload />} 
            colorScheme="blue"
            onClick={() => setIsUploadModalOpen(true)}
          >
            {tDriver('documents.uploadDocument')}
          </Button>
        }
      >
        {/* Progress Overview */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">{tDriver('documents.progressTitle')}</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">{tDriver('documents.completeness')}</Text>
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
                    {tDriver('documents.completeAll')}
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
                      <Button 
                        size="sm" 
                        leftIcon={<FiUpload />} 
                        colorScheme="blue" 
                        variant="outline"
                        onClick={() => {
                          setSelectedDocument(document);
                          setIsUploadModalOpen(true);
                        }}
                      >
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
            const fileInput = document.getElementById('document-file') as HTMLInputElement;
            const typeSelect = document.getElementById('document-type') as HTMLSelectElement;
            
            if (!fileInput.files || !fileInput.files[0]) {
              toast({
                title: 'Arquivo necessário',
                description: 'Por favor, selecione um arquivo.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
              });
              return;
            }

            if (!typeSelect.value) {
              toast({
                title: 'Tipo necessário',
                description: 'Por favor, selecione o tipo de documento.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
              });
              return;
            }

            await handleUpload(typeSelect.value, fileInput.files[0]);
            setIsUploadModalOpen(false);
          }}
          saveText="Enviar Documento"
        >
              <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              Selecione o tipo de documento e faça o upload do arquivo.
            </Text>
            
            <FormControl>
              <FormLabel>Tipo de Documento</FormLabel>
              <Select 
                id="document-type" 
                placeholder="Selecione o tipo"
                defaultValue={selectedDocument?.type || ''}
              >
                <option value="driving_license">Carta de Condução</option>
                <option value="vehicle_insurance">Seguro do Veículo</option>
                <option value="tvde_certificate">Certificado TVDE</option>
                <option value="technical_inspection">Inspeção Técnica</option>
              </Select>
            </FormControl>
            
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
              <Input
                id="document-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                display="none"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Update UI to show selected file
                    const fileName = document.getElementById('file-name');
                    if (fileName) {
                      fileName.textContent = file.name;
                    }
                  }
                }}
              />
              <Button
                onClick={() => document.getElementById('document-file')?.click()}
                variant="outline"
                size="sm"
              >
                Selecionar Arquivo
              </Button>
              <Text id="file-name" fontSize="xs" color="gray.500" mt={2}>
                Nenhum arquivo selecionado
              </Text>
              <Text fontSize="xs" color="gray.500">
                Formatos aceitos: PDF, JPG, PNG (máx. 10MB)
              </Text>
            </Box>
              </VStack>
        </StandardModal>
      </DriverLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get locale from context or default to 'pt'
    const locale = context.locale || 'pt';
    
    const translations = await loadTranslations(locale, ['common', 'driver']);

    // Get session from Iron Session
    const { getSession } = await import('@/lib/session/ironSession');
    const session = await getSession(context.req, context.res);
    
    if (!session.userId) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(session.userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    
    if (!userData || userData.role !== 'driver') {
      return {
        redirect: {
          destination: '/admin',
          permanent: false,
        },
      };
    }

    // Get driver data from Firestore
    const driverSnap = await adminDb.collection('drivers').where('uid', '==', userData.uid).limit(1).get();
    
    if (driverSnap.empty) {
      throw new Error('Driver not found');
    }

    const driverDoc = driverSnap.docs[0];
    const driver = {
      id: driverDoc.id,
      ...driverDoc.data(),
    };

    // Get documents from Firestore
    const documentsSnap = await adminDb.collection('driver_documents').where('driverId', '==', driverDoc.id).get();
    const uploadedDocuments = documentsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      verifiedAt: doc.data().verifiedAt?.toDate?.() || doc.data().verifiedAt,
      uploadedAt: doc.data().uploadedAt?.toDate?.() || doc.data().uploadedAt,
      rejectedAt: doc.data().rejectedAt?.toDate?.() || doc.data().rejectedAt,
    }));

    // Create default document types with status based on uploaded documents
    const defaultDocumentTypes = [
        {
          id: 'driving_license',
          name: translations.driver?.documents?.types?.drivingLicense || 'Carta de Condução',
          description: translations.driver?.documents?.descriptions?.drivingLicense || 'Carteira de habilitação válida',
          type: 'driving_license'
        },
        {
          id: 'vehicle_insurance',
          name: translations.driver?.documents?.types?.vehicleInsurance || 'Seguro do Veículo',
          description: translations.driver?.documents?.descriptions?.vehicleInsurance || 'Apólice de seguro do veículo',
          type: 'vehicle_insurance'
        },
        {
          id: 'tvde_certificate',
          name: translations.driver?.documents?.types?.tvdeCertificate || 'Certificado TVDE',
          description: translations.driver?.documents?.descriptions?.tvdeCertificate || 'Certificado de transporte de passageiros',
          type: 'tvde_certificate'
        },
        {
          id: 'technical_inspection',
          name: translations.driver?.documents?.types?.technicalInspection || 'Inspeção Técnica',
          description: translations.driver?.documents?.descriptions?.technicalInspection || 'Certificado de inspeção técnica do veículo',
          type: 'technical_inspection'
        }
      ];

    // Merge default types with uploaded documents
    const documents = defaultDocumentTypes.map(docType => {
      const uploadedDoc = uploadedDocuments.find(doc => doc.type === docType.type);
      if (uploadedDoc) {
        return {
          ...docType,
          ...uploadedDoc,
          status: uploadedDoc.status || 'pending'
        };
      }
      return {
        ...docType,
        status: 'not_uploaded'
      };
    });

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