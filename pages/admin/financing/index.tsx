import { useState, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useToast,
  Card,
  CardBody,
  Badge,
  Icon,
  IconButton,
  Tooltip,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { FiDollarSign, FiPlus, FiUpload, FiDownload, FiFileText, FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle, FiEdit, FiXCircle } from 'react-icons/fi';
import FinancingProofUpload from '@/components/admin/FinancingProofUpload';
import FinancingModal from '@/components/admin/FinancingModal';
import useSWR, { SWRConfig } from 'swr';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { getDrivers } from '@/lib/admin/adminQueries';
import { adminDb } from '@/lib/firebaseAdmin';
import { useRouter } from 'next/router';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Driver {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  status?: string;
}

interface AdminFinancingPageProps extends AdminPageProps {
  initialDrivers: Driver[];
  initialFinancing: any[];
  initialRequests: any[];
}

function AdminFinancingPageContent({
  user,
  locale,
  initialDrivers,
  initialFinancing,
  initialRequests,
  tCommon,
  tPage,
  translations,
}: AdminFinancingPageProps) {
  const router = useRouter();
  const toast = useToast();
  const { data, mutate } = useSWR('/api/admin/financing', fetcher);
  const financing: any[] = data?.financing || initialFinancing || [];
  
  // Solicitações com filtro de status
  const [requestStatusFilter, setRequestStatusFilter] = useState('pending');
  const { data: requestsData } = useSWR(`/api/admin/financing/requests?status=${requestStatusFilter}`, fetcher);
  const requests: any[] = requestsData?.requests || [];

  const [loading, setLoading] = useState(false);
  const [selectedFinancingId, setSelectedFinancingId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);
  const [editingFinancing, setEditingFinancing] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedFinancing, setSelectedFinancing] = useState<any | null>(null);

  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const handleOpenDetails = (fin: any) => {
    setSelectedFinancing(fin);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedFinancing(null);
    setIsDetailsModalOpen(false);
  };

  const handleEditFromDetails = () => {
    setEditingFinancing(selectedFinancing);
    setIsDetailsModalOpen(false);
    setIsFinancingModalOpen(true);
  };

  const handleUploadProofFromDetails = () => {
    setSelectedFinancingId(selectedFinancing?.id);
    setIsDetailsModalOpen(false);
    setIsUploadOpen(true);
  };

  const handleCancelFinancing = async () => {
    if (!selectedFinancing?.id) return;
    
    if (!confirm(t('financing.actions.cancelConfirm', 'Tem certeza que deseja cancelar este financiamento?'))) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/financing/${selectedFinancing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: t('financing.messages.cancelled', 'Financiamento cancelado'),
          status: 'success',
          duration: 3000,
        });
      mutate();
        handleCloseDetails();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: t('financing.messages.error', 'Erro'),
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calcular estatísticas
  const stats = useMemo(() => {
    const total = financing.length;
    const active = financing.filter(f => f.status === 'active').length;
    const completed = financing.filter(f => f.status === 'completed').length;
    const withProof = financing.filter(f => f.proofUrl).length;
    const withoutProof = total - withProof;
    
    const totalAmount = financing.reduce((sum, f) => sum + (f.amount || 0), 0);
    const activeAmount = financing
      .filter(f => f.status === 'active')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    
    const loans = financing.filter(f => f.type === 'loan').length;
    const discounts = financing.filter(f => f.type === 'discount').length;

    return {
      total,
      active,
      completed,
      withProof,
      withoutProof,
      totalAmount,
      activeAmount,
      loans,
      discounts,
    };
  }, [financing]);


  const handleAddFinancing = () => {
    setEditingFinancing(null);
    setIsFinancingModalOpen(true);
  };

  const handleEditFinancing = (financing: any) => {
    setEditingFinancing(financing);
    setIsFinancingModalOpen(true);
  };

  const handleCloseFinancingModal = () => {
    setIsFinancingModalOpen(false);
    setEditingFinancing(null);
  };

  const handleSaveFinancing = async (financingData: any) => {
    try {
      if (editingFinancing?.id) {
        // Modo edição - atualizar financiamento existente
        const response = await fetch(`/api/admin/financing/${editingFinancing.id}`, {
          method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(financingData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar financiamento');
        }

        toast({
          title: t('financing.updateSuccess', 'Financiamento atualizado'),
          status: 'success',
          duration: 2000,
        });
      } else {
        // Modo criação - criar novo financiamento
        const response = await fetch('/api/admin/financing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(financingData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar financiamento');
        }

        const result = await response.json();
        
        toast({
          title: t('financing.success.created', 'Financiamento criado!'),
          description: t('financing.success.createdDesc', 'O financiamento foi criado com sucesso.'),
          status: 'success',
          duration: 3000,
        });

        // Perguntar se quer anexar comprovante (opcional)
        if (result.id) {
          setTimeout(() => {
            if (window.confirm(t('financing.confirm.attachProof', 'Deseja anexar o comprovante de pagamento agora?'))) {
              setSelectedFinancingId(result.id);
              setIsUploadOpen(true);
            }
          }, 500);
        }

        return result; // Retorna para mostrar prompt de comprovante
      }

      mutate(); // Re-fetch financiamentos
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'loan' ? (
      <Badge colorScheme="blue">{t('financing.type.loan', 'Empréstimo')}</Badge>
    ) : (
      <Badge colorScheme="purple">{t('financing.type.discount', 'Desconto')}</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge colorScheme="green">{tc('status.active', 'Ativo')}</Badge>
    ) : (
      <Badge colorScheme="gray">{tc('status.completed', 'Completo')}</Badge>
    );
  };

  return (
    <AdminLayout
      title={t('financing.title', 'Financiamentos')}
      subtitle={t('financing.subtitle', 'Gerencie financiamentos e descontos dos motoristas')}
      breadcrumbs={[
        { label: t('financing.title', 'Financiamentos') }
      ]}
      translations={translations}
      side={
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="blue"
          size="sm"
          onClick={handleAddFinancing}
        >
          {t('financing.create.new', 'Novo Financiamento')}
        </Button>
      }
    >
      <VStack spacing={6} align="stretch">
        {/* ✅ Estatísticas */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiTrendingUp} mr={2} />
                    {t('financing.stats.total', 'Total')}
                  </StatLabel>
                  <StatNumber>{stats.total}</StatNumber>
                  <StatHelpText>{t('financing.stats.totalDesc', 'Financiamentos')}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiClock} mr={2} />
                    {t('financing.stats.active', 'Ativos')}
                  </StatLabel>
                  <StatNumber color="blue.500">{stats.active}</StatNumber>
                  <StatHelpText>€{stats.activeAmount.toFixed(2)}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiCheckCircle} mr={2} />
                    {t('financing.stats.completed', 'Completos')}
                  </StatLabel>
                  <StatNumber color="green.500">{stats.completed}</StatNumber>
                  <StatHelpText>{t('financing.stats.completedDesc', 'Finalizados')}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiFileText} mr={2} />
                    {t('financing.stats.withProof', 'Com Comprovante')}
                  </StatLabel>
                  <StatNumber color="purple.500">{stats.withProof}</StatNumber>
                  <StatHelpText>{t('financing.stats.withoutProof', 'Sem:')} {stats.withoutProof}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        <Divider />

        {/* Layout em 2 colunas: Financiamentos | Solicitações */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          {/* Coluna Esquerda: Financiamentos Existentes */}
          <GridItem>
            <Card>
              <CardBody>
                <Heading size="sm" mb={4} display="flex" alignItems="center">
                  <Icon as={FiDollarSign} mr={2} />
                  {t('financing.list.title', 'Financiamentos Existentes')}
                </Heading>
                
                <Box maxH="600px" overflowY="auto">
                  {financing.length === 0 ? (
                    <VStack spacing={2} align="center" py={8}>
                      <Icon as={FiCheckCircle} fontSize="3xl" color="gray.400" />
                      <Text color="gray.600" fontWeight="semibold">
                        {t('financing.list.empty', 'Nenhum financiamento')}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {t('financing.list.emptyDesc', 'Nenhum financiamento registrado ainda')}
                      </Text>
                    </VStack>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {financing.map((fin) => {
                        const driver = initialDrivers.find((d) => d.id === fin.driverId);
                        return (
                          <Box
                            key={fin.id}
                            p={3}
                            bg="white"
                            borderWidth={1}
                            borderRadius="md"
                            cursor="pointer"
                            _hover={{ bg: 'blue.50', borderColor: 'blue.300' }}
                            transition="all 0.2s"
                            onClick={() => handleOpenDetails(fin)}
                          >
                            <VStack align="start" spacing={2} w="full">
                              <HStack justify="space-between" w="full">
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold">{driver ? (driver.fullName || driver.name) : fin.driverId}</Text>
                                  <HStack spacing={2}>
                                    <Badge colorScheme={fin.type === 'loan' ? 'blue' : 'purple'}>
                                      {fin.type === 'loan' ? t('financing.type.loan', 'Empréstimo') : t('financing.type.discount', 'Desconto')}
                                    </Badge>
                                    <Badge colorScheme={fin.status === 'active' ? 'green' : 'gray'}>
                                      {fin.status === 'active' ? t('financing.status.active', 'Ativo') : t('financing.status.completed', 'Finalizado')}
                                    </Badge>
                                  </HStack>
                                </VStack>
                                <VStack align="end" spacing={0}>
                                  <Text fontWeight="bold" color="blue.600" fontSize="lg">€{(fin.amount || 0).toFixed(2)}</Text>
                                  {fin.weeklyInterest > 0 && (
                                    <Text fontSize="xs" color="orange.600">+{fin.weeklyInterest}% juros</Text>
                                  )}
                                </VStack>
                              </HStack>
                              
                              {/* Barra de progresso e info adicional */}
                              {fin.weeks && fin.type === 'loan' && (
                                <VStack align="stretch" spacing={1} w="full">
                                  <HStack justify="space-between" fontSize="xs" color="gray.600">
                                    <Text>{fin.weeks - (fin.remainingWeeks || 0)} / {fin.weeks} semanas pagas</Text>
                                    <Text fontWeight="bold">{fin.remainingWeeks || 0} restantes</Text>
                                  </HStack>
                                  <Box w="full" h="6px" bg="gray.200" borderRadius="full" overflow="hidden">
                                    <Box
                                      h="full"
                                      bg={fin.remainingWeeks === 0 ? 'green.400' : 'blue.400'}
                                      w={`${((fin.weeks - (fin.remainingWeeks || 0)) / fin.weeks) * 100}%`}
                                      transition="width 0.3s"
                                    />
                                  </Box>
                                  <HStack justify="space-between" fontSize="xs">
                                    <Text color="gray.600">
                                      Parcela: €{(fin.amount / fin.weeks).toFixed(2)}/sem
                                    </Text>
                                    {fin.proofUrl && (
                                      <HStack spacing={1} color="green.600">
                                        <Icon as={FiCheckCircle} boxSize={3} />
                                        <Text>Comprovante</Text>
                                      </HStack>
                                    )}
                                  </HStack>
                                </VStack>
                              )}
                              
                              {/* Para descontos, mostrar apenas se tem comprovante */}
                              {fin.type === 'discount' && (
                                <HStack w="full" justify="space-between" fontSize="xs">
                                  <Text color="gray.600">Desconto único</Text>
                                  {fin.proofUrl && (
                                    <HStack spacing={1} color="green.600">
                                      <Icon as={FiCheckCircle} boxSize={3} />
                                      <Text>Comprovante</Text>
                                    </HStack>
                                  )}
                                </HStack>
                              )}
                            </VStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}
                </Box>
              </CardBody>
            </Card>
          </GridItem>

          {/* Coluna Direita: Solicitações */}
          <GridItem>
            <Card borderLeft="4px" borderLeftColor="orange.400">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="sm" display="flex" alignItems="center">
                      <Icon as={FiAlertCircle} mr={2} color="orange.500" />
                      {t('financing.requests.title', 'Solicitações')}
                      <Badge ml={2} colorScheme="orange">{requests.length}</Badge>
                    </Heading>
                    
                    <Select
                      size="sm"
                      value={requestStatusFilter}
                      onChange={(e) => setRequestStatusFilter(e.target.value)}
                      maxW="150px"
                    >
                      <option value="pending">{t('requests.status.pending', 'Pendentes')}</option>
                      <option value="approved">{t('requests.status.approved', 'Aprovadas')}</option>
                      <option value="rejected">{t('requests.status.rejected', 'Rejeitadas')}</option>
              </Select>
                  </HStack>
                  
                  <Text color="gray.600" fontSize="sm">
                    {t('financing.requests.description', 'Solicitações de financiamento.')}
                  </Text>

                  <Box maxH="600px" overflowY="auto">
                    {requests.length === 0 ? (
                      <VStack spacing={2} align="center" py={8}>
                        <Icon as={FiCheckCircle} fontSize="3xl" color="green.400" />
                        <Text color="gray.600" fontWeight="semibold">
                          {t('financing.requests.empty', 'Nenhuma solicitação')}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {requestStatusFilter === 'pending' 
                            ? t('financing.requests.emptyDesc', 'Todas as solicitações foram processadas')
                            : t('financing.requests.noResults', 'Nenhum resultado para este filtro')
                          }
                        </Text>
                      </VStack>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {requests.map((req: any) => {
                    const driver = initialDrivers.find((d) => d.id === req.driverId);
                    return (
                      <Box
                        key={req.id}
                        p={4}
                        bg="orange.50"
                        borderRadius="md"
                        borderWidth={1}
                        borderColor="orange.200"
                      >
                        <HStack justify="space-between" wrap="wrap">
                          <VStack align="start" spacing={1} flex="1">
                            <Text fontWeight="bold">{driver ? (driver.fullName || driver.name) : req.driverId}</Text>
                            <HStack spacing={2}>
                              <Badge colorScheme={req.type === 'loan' ? 'blue' : 'purple'}>
                                {req.type === 'loan' ? t('financing.type.loan', 'Empréstimo') : t('financing.type.discount', 'Desconto')}
                              </Badge>
                              <Text fontSize="sm" fontWeight="bold" color="orange.700">
                                €{(req.amount || 0).toFixed(2)}
                              </Text>
                              {req.weeks && <Text fontSize="sm" color="gray.600">{req.weeks} semanas</Text>}
                            </HStack>
                            {req.reason && (
                              <Text fontSize="sm" color="gray.600" mt={1}>
                                {req.reason}
                              </Text>
                            )}
                          </VStack>
                          
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              colorScheme="orange"
                              onClick={() => router.push('/admin/financing/requests')}
                            >
                              {t('financing.requests.review', 'Revisar')}
                            </Button>
                          </HStack>
          </HStack>
        </Box>
                  );
                })}
                      </VStack>
          )}
        </Box>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

      </VStack>
      
      {/* Modal de Detalhes do Financiamento */}
      <Modal isOpen={isDetailsModalOpen} onClose={handleCloseDetails} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FiDollarSign} />
              <Text>{t('financing.details.title', 'Detalhes do Financiamento')}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedFinancing && (
              <VStack spacing={4} align="stretch">
                {/* Motorista */}
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>{t('financing.details.driver', 'Motorista')}</Text>
                  <Text fontWeight="bold" fontSize="lg">
                    {initialDrivers.find((d) => d.id === selectedFinancing.driverId)?.fullName || 
                     initialDrivers.find((d) => d.id === selectedFinancing.driverId)?.name || 
                     selectedFinancing.driverId}
                  </Text>
                </Box>

                <Divider />

                {/* Informações Principais */}
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">{t('financing.details.type', 'Tipo')}</Text>
                    <HStack>
                      <Badge colorScheme={selectedFinancing.type === 'loan' ? 'blue' : 'purple'} fontSize="md">
                        {selectedFinancing.type === 'loan' ? t('financing.type.loan', 'Empréstimo') : t('financing.type.discount', 'Desconto')}
                      </Badge>
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">{t('financing.details.status', 'Status')}</Text>
                    <Badge colorScheme={selectedFinancing.status === 'active' ? 'green' : 'gray'} fontSize="md">
                      {selectedFinancing.status === 'active' ? t('financing.status.active', 'Ativo') : t('financing.status.completed', 'Finalizado')}
                    </Badge>
                  </Box>
                </Grid>

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">{t('financing.details.amount', 'Valor')}</Text>
                    <Text fontWeight="bold" fontSize="xl" color="blue.600">€{(selectedFinancing.amount || 0).toFixed(2)}</Text>
                  </Box>
                  {selectedFinancing.weeks && (
                    <Box>
                      <Text fontSize="sm" color="gray.600">{t('financing.details.weeks', 'Progresso')}</Text>
                      <Text fontWeight="bold" fontSize="lg">
                        {selectedFinancing.weeks - (selectedFinancing.remainingWeeks || 0)} / {selectedFinancing.weeks} semanas pagas
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        {selectedFinancing.remainingWeeks || 0} semanas restantes
                      </Text>
                    </Box>
                  )}
                </Grid>

                {selectedFinancing.weeklyInterest > 0 && (
                  <Box>
                    <Text fontSize="sm" color="gray.600">{t('financing.details.interest', 'Juros Semanal')}</Text>
                    <Text fontWeight="bold">{selectedFinancing.weeklyInterest}%</Text>
                  </Box>
                )}

                <Box>
                  <Text fontSize="sm" color="gray.600">{t('financing.details.startDate', 'Data de Início')}</Text>
                  <Text>{selectedFinancing.startDate ? new Date(selectedFinancing.startDate).toLocaleDateString(locale || 'pt-PT') : '-'}</Text>
                </Box>

                {selectedFinancing.notes && (
                  <Box>
                    <Text fontSize="sm" color="gray.600">{t('financing.details.notes', 'Observações')}</Text>
                    <Text>{selectedFinancing.notes}</Text>
                  </Box>
                )}

                <Divider />

                {/* Comprovante */}
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>{t('financing.details.proof', 'Comprovante de Pagamento')}</Text>
                  {selectedFinancing.proofUrl ? (
                    <HStack>
                      <Icon as={FiCheckCircle} color="green.500" />
                      <Text color="green.600">{t('financing.proof.attached', 'Comprovante anexado')}</Text>
                      <Button
                        size="sm"
                        leftIcon={<Icon as={FiDownload} />}
                        colorScheme="green"
                        variant="outline"
                        onClick={() => window.open(selectedFinancing.proofUrl, '_blank')}
                      >
                        {t('financing.proof.view', 'Ver')}
                      </Button>
                    </HStack>
                  ) : (
                    <HStack>
                      <Icon as={FiAlertCircle} color="orange.500" />
                      <Text color="gray.600">{t('financing.proof.notAttached', 'Sem comprovante')}</Text>
                    </HStack>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3} w="full" justify="space-between">
              <HStack>
                {selectedFinancing?.status === 'active' && (
                  <Button
                    colorScheme="red"
                    variant="outline"
                    leftIcon={<Icon as={FiXCircle} />}
                    onClick={handleCancelFinancing}
                    isLoading={loading}
                  >
                    {t('financing.actions.cancel', 'Cancelar')}
                  </Button>
                )}
              </HStack>
              <HStack>
                <Button
                  leftIcon={<Icon as={FiUpload} />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={handleUploadProofFromDetails}
                >
                  {selectedFinancing?.proofUrl 
                    ? t('financing.proof.update', 'Atualizar Comprovante')
                    : t('financing.proof.attach', 'Anexar Comprovante')
                  }
                </Button>
                <Button
                  leftIcon={<Icon as={FiEdit} />}
                  colorScheme="green"
                  onClick={handleEditFromDetails}
                >
                  {t('common.actions.edit', 'Editar')}
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal de Upload de Comprovante */}
      {selectedFinancingId && (
        <FinancingProofUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
          financingId={selectedFinancingId}
          onUploadSuccess={() => {
            mutate();
            toast({
              title: t('financing.success.proofAttached', 'Comprovante anexado!'),
              status: 'success',
            });
          }}
        />
      )}

      <FinancingModal
        isOpen={isFinancingModalOpen}
        onClose={handleCloseFinancingModal}
        financing={editingFinancing}
        drivers={initialDrivers}
        onSave={handleSaveFinancing}
        tCommon={tCommon}
        tPage={tPage}
      />
    </AdminLayout>
  );
}

export default function AdminFinancingPage(props: AdminFinancingPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/admin/financing': { success: true, financing: props.initialFinancing },
          '/api/admin/financing/requests': { success: true, requests: props.initialRequests },
        },
      }}
    >
      <AdminFinancingPageContent {...props} />
    </SWRConfig>
  );
}

// SSR com autenticação admin - Carrega TODOS os dados necessários
export const getServerSideProps = withAdminSSR(async (context, user) => {
  const drivers = await getDrivers({ status: 'active' });
  
  // Buscar financiamentos direto do Firestore
  const financingSnapshot = await adminDb
    .collection('financing')
    .orderBy('createdAt', 'desc')
    .get();
  const financing = financingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Buscar solicitações pendentes
  const requestsSnapshot = await adminDb
    .collection('financing_requests')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    initialDrivers: drivers,
    initialFinancing: financing,
    initialRequests: requests,
  };
});
