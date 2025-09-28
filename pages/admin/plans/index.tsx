import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withAdmin } from '@/lib/auth/withAdmin';
import { adminDb } from '@/lib/firebaseAdmin';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Spacer,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { 
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiCheck,
  FiX,
  FiStar,
  FiTrendingUp
} from 'react-icons/fi';
import { loadTranslations } from '@/lib/translations';
import { useState, useMemo } from 'react';

interface PlansManagementProps {
  plans: any[];
  stats: {
    totalPlans: number;
    activePlans: number;
    totalSubscriptions: number;
    monthlyRevenue: number;
  };
  tCommon: any;
  tAdmin: any;
}

export default function PlansManagement({ 
  plans, 
  stats,
  tCommon,
  tAdmin 
}: PlansManagementProps) {
  const cardBg = 'white';
  const borderColor = 'gray.200';
  const bgColor = 'gray.50';
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    interval: 'month',
    trialDays: 0,
    features: [] as string[],
    active: true,
    featured: false,
  });

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const matchesSearch = 
        plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && plan.active) ||
        (statusFilter === 'inactive' && !plan.active);
      
      return matchesSearch && matchesStatus;
    });
  }, [plans, searchTerm, statusFilter]);

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setIsEditing(false);
    setFormData({
      name: '',
      description: '',
      price: 0,
      interval: 'month',
      trialDays: 0,
      features: [],
      active: true,
      featured: false,
    });
    onOpen();
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsEditing(true);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price || 0,
      interval: plan.interval || 'month',
      trialDays: plan.trialDays || 0,
      features: plan.features || [],
      active: plan.active ?? true,
      featured: plan.featured ?? false,
    });
    onOpen();
  };

  const handleSavePlan = async () => {
    setLoading(true);
    try {
      const url = isEditing ? `/api/admin/plans/${selectedPlan.id}` : '/api/admin/plans';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: isEditing ? 'Plano atualizado' : 'Plano criado',
          description: isEditing 
            ? 'Plano atualizado com sucesso'
            : 'Plano criado com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save plan');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : (isEditing 
          ? 'Falha ao atualizar plano'
          : 'Falha ao criar plano'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Tem certeza que deseja deletar este plano?')) return;

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Plano deletado',
          description: 'Plano deletado com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete plan');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao deletar plano',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  return (
    <>
      <Head>
        <title>Gerenciar Planos - Conduz.pt</title>
      </Head>
      
      <Box minH="100vh" bg={bgColor}>
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={6} shadow="sm">
          <Box maxW="7xl" mx="auto" px={4}>
            <Flex align="center">
              <VStack align="flex-start" spacing={1}>
                <Heading size="lg" color="gray.800">
                  Gerenciar Planos
                </Heading>
                <Text color="gray.600">
                  Gerencie os planos de assinatura da plataforma
                </Text>
              </VStack>
              <Spacer />
              <Button leftIcon={<FiPlus />} colorScheme="purple" onClick={handleCreatePlan}>
                Novo Plano
              </Button>
            </Flex>
          </Box>
        </Box>

        <Box maxW="7xl" mx="auto" px={4} py={8}>
          <VStack spacing={6} align="stretch">
            {/* Stats Cards */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total de Planos</StatLabel>
                    <StatNumber>{stats.totalPlans}</StatNumber>
                    <StatHelpText>Planos criados</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Planos Ativos</StatLabel>
                    <StatNumber color="green.500">{stats.activePlans}</StatNumber>
                    <StatHelpText>Disponíveis</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Assinaturas</StatLabel>
                    <StatNumber color="blue.500">{stats.totalSubscriptions}</StatNumber>
                    <StatHelpText>Ativas</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Receita Mensal</StatLabel>
                    <StatNumber color="purple.500">€{stats.monthlyRevenue.toFixed(2)}</StatNumber>
                    <StatHelpText>Recorrente</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Filters */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <HStack spacing={4} wrap="wrap">
                  <InputGroup maxW="300px">
                    <InputLeftElement>
                      <FiSearch />
                    </InputLeftElement>
                    <Input
                      placeholder="Buscar planos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>

                  <Select
                    maxW="200px"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </Select>

                  <Text fontSize="sm" color="gray.600">
                    {filteredPlans.length} de {plans.length} planos
                  </Text>
                </HStack>
              </CardBody>
            </Card>

            {/* Plans Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  bg={cardBg} 
                  borderColor={plan.featured ? 'purple.500' : borderColor}
                  borderWidth={plan.featured ? '2px' : '1px'}
                  position="relative"
                  shadow={plan.featured ? 'lg' : 'sm'}
                >
                  {plan.featured && (
                    <Badge 
                      colorScheme="purple" 
                      position="absolute" 
                      top="-10px" 
                      left="50%" 
                      transform="translateX(-50%)"
                      px={3}
                      py={1}
                    >
                      Destaque
                    </Badge>
                  )}
                  
                  <CardHeader textAlign="center" pb={2}>
                    <VStack spacing={2}>
                      <HStack>
                        <Heading size="md" color={plan.featured ? 'purple.600' : 'gray.800'}>
                          {plan.name}
                        </Heading>
                        {!plan.active && (
                          <Badge colorScheme="red">Inativo</Badge>
                        )}
                      </HStack>
                      <HStack align="baseline">
                        <Text fontSize="3xl" fontWeight="bold" color={plan.featured ? 'purple.600' : 'gray.800'}>
                          €{(plan.price / 100).toFixed(0)}
                        </Text>
                        <Text color="gray.500">
                          /{plan.interval === 'month' ? 'mês' : 'ano'}
                        </Text>
                      </HStack>
                      {plan.trialDays > 0 && (
                        <Badge colorScheme="green">
                          {plan.trialDays} dias grátis
                        </Badge>
                      )}
                    </VStack>
                  </CardHeader>

                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        {plan.description}
                      </Text>

                      {plan.features && plan.features.length > 0 && (
                        <List spacing={1}>
                          {plan.features.slice(0, 3).map((feature: string, index: number) => (
                            <ListItem key={index} fontSize="sm">
                              <ListIcon as={FiCheck} color="green.500" />
                              {feature}
                            </ListItem>
                          ))}
                          {plan.features.length > 3 && (
                            <Text fontSize="xs" color="gray.500" mt={2}>
                              +{plan.features.length - 3} mais funcionalidades
                            </Text>
                          )}
                        </List>
                      )}

                      <HStack justify="space-between" pt={2}>
                        <VStack align="flex-start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">Assinaturas</Text>
                          <Text fontSize="sm" fontWeight="bold">
                            {plan.subscriptions?.length || 0}
                          </Text>
                        </VStack>
                        <VStack align="flex-end" spacing={0}>
                          <Text fontSize="xs" color="gray.500">Receita/mês</Text>
                          <Text fontSize="sm" fontWeight="bold" color="green.600">
                            €{((plan.subscriptions?.length || 0) * (plan.price / 100)).toFixed(2)}
                          </Text>
                        </VStack>
                      </HStack>

                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Ver detalhes"
                          icon={<FiEye />}
                          size="sm"
                          variant="outline"
                          flex={1}
                        />
                        <IconButton
                          aria-label="Editar"
                          icon={<FiEdit />}
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          onClick={() => handleEditPlan(plan)}
                          flex={1}
                        />
                        <IconButton
                          aria-label="Deletar"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => handleDeletePlan(plan.id)}
                          flex={1}
                        />
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>

            {filteredPlans.length === 0 && (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Text color="gray.500" textAlign="center" py={8}>
                    Nenhum plano encontrado com os filtros aplicados.
                  </Text>
                </CardBody>
              </Card>
            )}
          </VStack>
        </Box>

        {/* Plan Form Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {isEditing ? 'Editar Plano' : 'Criar Novo Plano'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Nome do Plano</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Plano Básico"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Preço (€)</FormLabel>
                    <NumberInput
                      value={formData.price / 100}
                      onChange={(_, value) => setFormData(prev => ({ ...prev, price: (value || 0) * 100 }))}
                      min={0}
                      precision={2}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Descrição</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do plano..."
                    rows={3}
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Intervalo de Cobrança</FormLabel>
                    <Select
                      value={formData.interval}
                      onChange={(e) => setFormData(prev => ({ ...prev, interval: e.target.value }))}
                    >
                      <option value="month">Mensal</option>
                      <option value="year">Anual</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Dias de Trial</FormLabel>
                    <NumberInput
                      value={formData.trialDays}
                      onChange={(_, value) => setFormData(prev => ({ ...prev, trialDays: value || 0 }))}
                      min={0}
                      max={90}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Funcionalidades</FormLabel>
                  <VStack spacing={2} align="stretch">
                    {formData.features.map((feature, index) => (
                      <HStack key={index}>
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="Descreva uma funcionalidade..."
                        />
                        <IconButton
                          aria-label="Remover"
                          icon={<FiX />}
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => removeFeature(index)}
                        />
                      </HStack>
                    ))}
                    <Button
                      leftIcon={<FiPlus />}
                      variant="outline"
                      size="sm"
                      onClick={addFeature}
                    >
                      Adicionar Funcionalidade
                    </Button>
                  </VStack>
                </FormControl>

                <SimpleGrid columns={2} spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">Plano Ativo</FormLabel>
                    <Switch
                      isChecked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                      colorScheme="green"
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">Plano em Destaque</FormLabel>
                    <Switch
                      isChecked={formData.featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      colorScheme="purple"
                    />
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="purple" 
                onClick={handleSavePlan}
                isLoading={loading}
              >
                {isEditing ? 'Atualizar Plano' : 'Criar Plano'}
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
    // Get user data from context (passed by withAdmin HOC)
    const userData = (context as any).userData || null;
    
    if (!userData) {
      throw new Error('User data not found');
    }

    // Load translations
    // Extract locale from middleware header
    const locale = Array.isArray(context.req.headers['x-locale']) 
      ? context.req.headers['x-locale'][0] 
      : context.req.headers['x-locale'] || 'pt';
    
    const translations = await loadTranslations(locale, ['common', 'admin']);
    const { common: tCommon, admin: tAdmin } = translations;

    // Get all plans from Firestore
    const plansSnap = await adminDb.collection('plans').get();
    const plans = plansSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get subscriptions for revenue calculation
    const subscriptionsSnap = await adminDb.collection('subscriptions').get();
    const subscriptions = subscriptionsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate stats
    const stats = {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.active).length,
      totalSubscriptions: subscriptions.filter(s => s.status === 'active').length,
      monthlyRevenue: subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => {
          const plan = plans.find(p => p.id === s.planId);
          if (plan && plan.interval === 'month') {
            return sum + (plan.price / 100);
          } else if (plan && plan.interval === 'year') {
            return sum + (plan.price / 100 / 12);
          }
          return sum;
        }, 0),
    };

    // Add subscription count to each plan
    const plansWithStats = plans.map(plan => ({
      ...plan,
      subscriptions: subscriptions.filter(s => s.planId === plan.id && s.status === 'active')
    }));

    return {
      props: {
        plans: plansWithStats,
        stats,
        tCommon,
        tAdmin,
      },
    };
  } catch (error) {
    console.error('Error loading plans management:', error);
    return {
      props: {
        plans: [],
        stats: {
          totalPlans: 0,
          activePlans: 0,
          totalSubscriptions: 0,
          monthlyRevenue: 0,
        },
        tCommon: {},
        tAdmin: {},
      },
    };
  }
};
