import { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Button, SimpleGrid, useToast, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, Textarea } from '@chakra-ui/react';
import { FiUpload, FiEye, FiTrash2, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { withAuth } from '../../lib/auth/withAuth';
import LoggedInLayout from '../../components/LoggedInLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { useAuth } from '../../lib/auth';
import { dashboardAPI } from '../../lib/api/dashboard';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  url?: string;
  rejectionReason?: string;
}

function DriverDocuments() {
  const { user } = useAuth();
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: '',
    description: '',
    file: null as File | null
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await dashboardAPI.getDocuments(user?.uid || '');
      setDocuments(response.documents);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar documentos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name || !uploadForm.type) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('name', uploadForm.name);
      formData.append('type', uploadForm.type);
      formData.append('description', uploadForm.description);

      await dashboardAPI.uploadDocument(user?.uid || '', uploadForm.file, uploadForm.type);
      
      toast({
        title: 'Sucesso',
        description: 'Documento enviado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setUploadForm({
        name: '',
        type: '',
        description: '',
        file: null
      });
      
      onUploadClose();
      loadDocuments();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar documento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;

    try {
      await dashboardAPI.deleteDocument(user?.uid || '', selectedDocument.id);
      
      toast({
        title: 'Sucesso',
        description: 'Documento removido com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onDeleteClose();
      loadDocuments();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao remover documento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <FiCheck color="green" />;
      case 'rejected':
        return <FiX color="red" />;
      default:
        return <FiClock color="orange" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green.500';
      case 'rejected':
        return 'red.500';
      default:
        return 'orange.500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return 'Pendente';
    }
  };

  const pendingCount = documents.filter(doc => doc.status === 'pending').length;
  const approvedCount = documents.filter(doc => doc.status === 'approved').length;
  const rejectedCount = documents.filter(doc => doc.status === 'rejected').length;

  return (
    <LoggedInLayout>
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Meus Documentos
          </Text>
          <Text color="gray.600">
            Gerencie seus documentos e acompanhe o status de aprovação
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <StatsCard
            title="Total de Documentos"
            value={documents.length}
            icon={FiUpload}
            color="blue.500"
          />
          <StatsCard
            title="Aprovados"
            value={approvedCount}
            icon={FiCheck}
            color="green.500"
          />
          <StatsCard
            title="Pendentes"
            value={pendingCount}
            icon={FiClock}
            color="orange.500"
          />
        </SimpleGrid>

        <Box>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="lg" fontWeight="semibold">
              Documentos
            </Text>
            <Button
              leftIcon={<FiUpload />}
              colorScheme="blue"
              onClick={onUploadOpen}
            >
              Enviar Documento
            </Button>
          </HStack>

          <VStack spacing={4} align="stretch">
            {loading ? (
              <Text>Carregando documentos...</Text>
            ) : documents.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">Nenhum documento encontrado</Text>
                <Button
                  mt={4}
                  leftIcon={<FiUpload />}
                  colorScheme="blue"
                  onClick={onUploadOpen}
                >
                  Enviar Primeiro Documento
                </Button>
              </Box>
            ) : (
              documents.map((document) => (
                <Box
                  key={document.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  bg="white"
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="semibold">{document.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {document.type}
                      </Text>
                      <HStack>
                        {getStatusIcon(document.status)}
                        <Text
                          fontSize="sm"
                          color={getStatusColor(document.status)}
                          fontWeight="medium"
                        >
                          {getStatusText(document.status)}
                        </Text>
                      </HStack>
                      {document.status === 'rejected' && document.rejectionReason && (
                        <Text fontSize="sm" color="red.500">
                          Motivo: {document.rejectionReason}
                        </Text>
                      )}
                      <Text fontSize="xs" color="gray.500">
                        Enviado em: {new Date(document.uploadedAt).toLocaleDateString()}
                      </Text>
                    </VStack>
                    <HStack>
                      {document.url && (
                        <Button
                          size="sm"
                          leftIcon={<FiEye />}
                          onClick={() => {
                            setSelectedDocument(document);
                            onViewOpen();
                          }}
                        >
                          Visualizar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<FiTrash2 />}
                        onClick={() => {
                          setSelectedDocument(document);
                          onDeleteOpen();
                        }}
                      >
                        Remover
                      </Button>
                    </HStack>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </Box>
      </VStack>

      {/* Upload Modal */}
      <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enviar Documento</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nome do Documento</FormLabel>
                <Input
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="Ex: Carteira de Motorista"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Tipo</FormLabel>
                <Input
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                  placeholder="Ex: CNH, RG, CPF"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Descrição</FormLabel>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Informações adicionais (opcional)"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Arquivo</FormLabel>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setUploadForm({ ...uploadForm, file });
                  }}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Formatos aceitos: PNG, JPG, PDF (máx. 10MB)
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onUploadClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUpload}
              isLoading={uploading}
              loadingText="Enviando..."
            >
              Enviar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Visualizar Documento</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedDocument?.url && (
              <Box>
                {selectedDocument.url.endsWith('.pdf') ? (
                  <iframe
                    src={selectedDocument.url}
                    width="100%"
                    height="500px"
                    style={{ border: 'none' }}
                  />
                ) : (
                  <img
                    src={selectedDocument.url}
                    alt={selectedDocument.name}
                    style={{ width: '100%', height: 'auto' }}
                  />
                )}
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Fechar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose} leastDestructiveRef={undefined}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remover Documento
            </AlertDialogHeader>
            <AlertDialogBody>
              Tem certeza que deseja remover o documento "{selectedDocument?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Remover
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </LoggedInLayout>
  );
}

export default withAuth(DriverDocuments);
