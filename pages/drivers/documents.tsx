import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withDriver } from '@/lib/auth/withDriver';
import { store } from '@/lib/store';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  useColorModeValue,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Icon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Image,
  AspectRatio,
} from '@chakra-ui/react';
import { 
  FiUpload,
  FiCheck,
  FiX,
  FiClock,
  FiAlertTriangle,
  FiFileText,
  FiCamera,
  FiDownload,
  FiEye,
  FiRefreshCw
} from 'react-icons/fi';
import { loadTranslations } from '@/lib/translations';
import { useState, useRef } from 'react';

interface DocumentsPageProps {
  driver: any;
  documents: any[];
  tCommon: any;
  tDriver: any;
}

interface Document {
  id: string;
  type: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  uploadDate: string;
  expiryDate?: string;
  fileUrl?: string;
  rejectionReason?: string;
  required: boolean;
}

export default function DocumentsPage({ 
  driver, 
  documents, 
  tCommon,
  tDriver 
}: DocumentsPageProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const documentTypes = [
    {
      type: 'driving_license',
      name: 'Carta de Condução',
      description: 'Carta de condução válida',
      required: true,
      icon: FiFileText
    },
    {
      type: 'tvde_certificate',
      name: 'Certificado TVDE',
      description: 'Certificado de motorista TVDE',
      required: true,
      icon: FiFileText
    },
    {
      type: 'vehicle_registration',
      name: 'Certificado de Registo',
      description: 'Documento de registo do veículo',
      required: true,
      icon: FiFileText
    },
    {
      type: 'vehicle_insurance',
      name: 'Seguro do Veículo',
      description: 'Apólice de seguro válida',
      required: true,
      icon: FiFileText
    },
    {
      type: 'criminal_record',
      name: 'Registo Criminal',
      description: 'Certificado de registo criminal',
      required: true,
      icon: FiFileText
    },
    {
      type: 'medical_certificate',
      name: 'Atestado Médico',
      description: 'Atestado médico de aptidão',
      required: false,
      icon: FiFileText
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      case 'expired': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      case 'expired': return 'Expirado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return FiCheck;
      case 'pending': return FiClock;
      case 'rejected': return FiX;
      case 'expired': return FiAlertTriangle;
      default: return FiClock;
    }
  };

  const isDocumentExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry > now;
  };

  const handleUploadDocument = (documentType: any) => {
    setSelectedDocument(documentType);
    onOpen();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleSubmitDocument = async () => {
    if (!uploadFile || !selectedDocument) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('documentType', selectedDocument.type);
      formData.append('driverId', driver.id);

      const response = await fetch('/api/drivers/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: 'Documento enviado',
          description: 'Seu documento foi enviado e está sendo analisado.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
        setUploadFile(null);
        // Refresh page or update documents list
        window.location.reload();
      } else {
        throw new Error('Failed to upload document');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar documento. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const getDocumentForType = (type: string) => {
    return documents.find(doc => doc.type === type);
  };

  const calculateCompletionPercentage = () => {
    const requiredDocs = documentTypes.filter(doc => doc.required);
    const approvedDocs = requiredDocs.filter(doc => {
      const document = getDocumentForType(doc.type);
      return document && document.status === 'approved';
    });
    return Math.round((approvedDocs.length / requiredDocs.length) * 100);
  };

  return (
    <>
      <Head>
        <title>Meus Documentos - Conduz.pt</title>
      </Head>
      
      <Box minH="100vh" bg={bgColor}>
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={6} shadow="sm">
          <Box maxW="7xl" mx="auto" px={4}>
            <VStack spacing={4} align="center">
              <Heading size="lg" color="gray.800">
                Meus Documentos
              </Heading>
              <Text color="gray.600" textAlign="center">
                Mantenha seus documentos atualizados para garantir o funcionamento da sua conta
              </Text>
              
              {/* Progress Bar */}
              <Box w="full" maxW="md">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" color="gray.600">Progresso de Documentação</Text>
                  <Text fontSize="sm" fontWeight="bold" color="purple.600">
                    {calculateCompletionPercentage()}%
                  </Text>
                </HStack>
                <Progress 
                  value={calculateCompletionPercentage()} 
                  colorScheme="purple" 
                  size="lg" 
                  borderRadius="md"
                />
              </Box>
            </VStack>
          </Box>
        </Box>

        <Box maxW="7xl" mx="auto" px={4} py={8}>
          <VStack spacing={6} align="stretch">
            {/* Status Alert */}
            {calculateCompletionPercentage() < 100 && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Documentação Incompleta</AlertTitle>
                  <AlertDescription>
                    Complete o envio de todos os documentos obrigatórios para ativar sua conta.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Documents Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {documentTypes.map((docType) => {
                const document = getDocumentForType(docType.type);
                const StatusIcon = getStatusIcon(document?.status || 'pending');
                
                return (
                  <Card 
                    key={docType.type} 
                    bg={cardBg} 
                    borderColor={document?.required && !document ? 'red.200' : borderColor}
                    borderWidth={document?.required && !document ? '2px' : '1px'}
                  >
                    <CardHeader pb={2}>
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={docType.icon} color="purple.500" />
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="bold" fontSize="sm">
                              {docType.name}
                            </Text>
                            {docType.required && (
                              <Badge colorScheme="red" size="sm">Obrigatório</Badge>
                            )}
                          </VStack>
                        </HStack>
                        {document && (
                          <Icon 
                            as={StatusIcon} 
                            color={`${getStatusColor(document.status)}.500`}
                          />
                        )}
                      </HStack>
                    </CardHeader>

                    <CardBody pt={0}>
                      <VStack spacing={3} align="stretch">
                        <Text fontSize="sm" color="gray.600">
                          {docType.description}
                        </Text>

                        {document ? (
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="gray.500">Status:</Text>
                              <Badge colorScheme={getStatusColor(document.status)}>
                                {getStatusText(document.status)}
                              </Badge>
                            </HStack>

                            {document.uploadDate && (
                              <HStack justify="space-between">
                                <Text fontSize="xs" color="gray.500">Enviado:</Text>
                                <Text fontSize="xs">
                                  {new Date(document.uploadDate).toLocaleDateString('pt-BR')}
                                </Text>
                              </HStack>
                            )}

                            {document.expiryDate && (
                              <HStack justify="space-between">
                                <Text fontSize="xs" color="gray.500">Expira:</Text>
                                <Text 
                                  fontSize="xs" 
                                  color={isDocumentExpiringSoon(document.expiryDate) ? 'orange.500' : 'gray.700'}
                                >
                                  {new Date(document.expiryDate).toLocaleDateString('pt-BR')}
                                </Text>
                              </HStack>
                            )}

                            {document.status === 'rejected' && document.rejectionReason && (
                              <Alert status="error" size="sm">
                                <AlertIcon />
                                <Text fontSize="xs">{document.rejectionReason}</Text>
                              </Alert>
                            )}

                            {isDocumentExpiringSoon(document.expiryDate) && (
                              <Alert status="warning" size="sm">
                                <AlertIcon />
                                <Text fontSize="xs">Documento expira em breve</Text>
                              </Alert>
                            )}

                            <HStack spacing={2}>
                              {document.fileUrl && (
                                <Button size="xs" leftIcon={<FiEye />} variant="outline">
                                  Ver
                                </Button>
                              )}
                              <Button 
                                size="xs" 
                                leftIcon={<FiRefreshCw />} 
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => handleUploadDocument(docType)}
                              >
                                Atualizar
                              </Button>
                            </HStack>
                          </VStack>
                        ) : (
                          <Button
                            leftIcon={<FiUpload />}
                            colorScheme={docType.required ? 'red' : 'purple'}
                            variant={docType.required ? 'solid' : 'outline'}
                            size="sm"
                            onClick={() => handleUploadDocument(docType)}
                          >
                            Enviar Documento
                          </Button>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>

            {/* Help Section */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Precisa de Ajuda?</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text color="gray.600">
                    Se tiver dúvidas sobre os documentos necessários ou problemas com o upload, 
                    nossa equipe está aqui para ajudar.
                  </Text>
                  
                  <HStack spacing={4}>
                    <Button leftIcon={<FiFileText />} colorScheme="blue" variant="outline">
                      Guia de Documentos
                    </Button>
                    <Button leftIcon={<FiCamera />} colorScheme="green" variant="outline">
                      Dicas de Fotografia
                    </Button>
                  </HStack>

                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Formatos Aceitos</AlertTitle>
                      <AlertDescription fontSize="xs">
                        JPG, PNG, PDF até 5MB. Certifique-se de que o documento está legível e completo.
                      </AlertDescription>
                    </Box>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Box>

        {/* Upload Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Enviar {selectedDocument?.name}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">Instruções</AlertTitle>
                    <AlertDescription fontSize="xs">
                      • Certifique-se de que o documento está legível<br/>
                      • Formatos aceitos: JPG, PNG, PDF (máx. 5MB)<br/>
                      • Inclua todas as páginas do documento
                    </AlertDescription>
                  </Box>
                </Alert>

                <FormControl>
                  <FormLabel>Selecionar Arquivo</FormLabel>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    display="none"
                  />
                  <Button
                    leftIcon={<FiUpload />}
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    w="full"
                  >
                    {uploadFile ? uploadFile.name : 'Escolher Arquivo'}
                  </Button>
                </FormControl>

                {uploadFile && (
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <HStack justify="space-between">
                      <VStack align="flex-start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">{uploadFile.name}</Text>
                        <Text fontSize="xs" color="gray.600">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </Text>
                      </VStack>
                      <Button size="xs" onClick={() => setUploadFile(null)}>
                        Remover
                      </Button>
                    </HStack>
                  </Box>
                )}

                {selectedDocument?.type === 'vehicle_insurance' && (
                  <FormControl>
                    <FormLabel>Data de Expiração</FormLabel>
                    <Input type="date" />
                  </FormControl>
                )}
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="purple" 
                onClick={handleSubmitDocument}
                isLoading={uploading}
                isDisabled={!uploadFile}
              >
                Enviar Documento
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Simulate user authentication check
    const userType = context.req.cookies['user-type'];
    const authToken = context.req.cookies['auth-token'];
    
    if (!authToken || userType !== 'driver') {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }
    
    // Load translations
    const translations = await loadTranslations(context.locale || 'pt', ['common', 'driver']);

    // Mock driver data
    const driver = {
      id: 'demo-driver-1',
      name: 'João Silva',
      email: 'motorista@conduz.pt',
      status: 'approved'
    };
    
    // Mock documents data
    const documents = {
      driving_license: { status: 'approved', uploadDate: '2024-01-15', expiryDate: '2029-01-15' },
      id_card: { status: 'approved', uploadDate: '2024-01-15', expiryDate: '2029-01-15' },
      criminal_record: { status: 'pending', uploadDate: '2024-01-20', expiryDate: null },
      medical_certificate: { status: 'missing', uploadDate: null, expiryDate: null },
      tvde_license: { status: 'approved', uploadDate: '2024-01-10', expiryDate: '2026-01-10' },
      vehicle_registration: { status: 'approved', uploadDate: '2024-01-12', expiryDate: '2025-12-31' },
      insurance: { status: 'expired', uploadDate: '2023-12-01', expiryDate: '2024-12-01' },
      inspection: { status: 'approved', uploadDate: '2024-01-05', expiryDate: '2025-01-05' }
    };

    return {
      props: {
        driver,
        documents,
        translations,
      },
    };
  } catch (error) {
    console.error('Error loading documents page:', error);
    return {
      props: {
        driver: null,
        documents: {},
        translations: {},
      },
    };
  }
};
