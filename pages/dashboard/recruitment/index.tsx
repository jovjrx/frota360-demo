import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiCopy,
  FiMail,
  FiPhone,
  FiPlus,
  FiCheck,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import useSWR from 'swr';
import { useState } from 'react';

interface RecruitedDriver {
  driverId: string;
  driverName: string;
  driverEmail: string;
  recruitedDate: string;
  status: string;
  currentLevel: number;
}

interface NetworkData {
  success: boolean;
  driver: {
    id: string;
    name: string;
    affiliateLevel: number;
  };
  network: {
    totalRecruitments: number;
    activeRecruitments: number;
    recruitedDrivers: RecruitedDriver[];
  };
  invites: Array<{
    id: string;
    inviteCode: string;
    email?: string;
    phone?: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    acceptedAt?: string;
    acceptedByDriverName?: string;
  }>;
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function RecruitmentPage({ translations, locale }: DashboardPageProps) {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error, mutate } = useSWR<NetworkData>(
    '/api/driver/referral/my-network',
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleCreateInvite = async () => {
    if (!email && !phone) {
      toast({
        title: 'Erro',
        description: 'Preencha pelo menos um campo (email ou telefone)',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/driver/referral/create-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email || undefined, phone: phone || undefined }),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Convite criado com sucesso!',
          status: 'success',
          duration: 3000,
        });
        setEmail('');
        setPhone('');
        onClose();
        mutate();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao criar convite',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copiado',
      description: 'Código de convite copiado para a área de transferência',
      status: 'success',
      duration: 2000,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Recrutamento" translations={translations}>
        <Center minH="400px">
          <Spinner size="lg" color="green.500" />
        </Center>
      </DashboardLayout>
    );
  }

  if (error || !data?.success) {
    return (
      <DashboardLayout title="Recrutamento" translations={translations}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            Não foi possível carregar seus dados de recrutamento.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const { network, invites } = data;

  return (
    <DashboardLayout
      title="Recrutamento"
      subtitle="Recrute novos motoristas e ganhe comissões"
      translations={translations}
      side={
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="green"
          onClick={onOpen}
        >
          Novo Convite
        </Button>
      }
    >
      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="green.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Total Recrutado</StatLabel>
            <StatNumber color="green.600" fontSize="2xl">
              {network.totalRecruitments}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Motoristas recrutados
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="blue.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Ativos Agora</StatLabel>
            <StatNumber color="blue.600" fontSize="2xl">
              {network.activeRecruitments}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Gerando comissões
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="purple.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Convites Pendentes</StatLabel>
            <StatNumber color="purple.600" fontSize="2xl">
              {invites.filter(i => i.status === 'pending').length}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Aguardando resposta
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Convites Ativos */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" mb={6}>
        <VStack align="stretch" spacing={4}>
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              Seus Convites
            </Text>
            <Text fontSize="sm" color="gray.500">
              Compartilhe esses códigos para recrutar novos motoristas
            </Text>
          </VStack>

          <Divider />

          {invites.length === 0 ? (
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <AlertTitle>Nenhum convite criado</AlertTitle>
              <AlertDescription>
                Clique em "Novo Convite" para começar a recrutar motoristas.
              </AlertDescription>
            </Alert>
          ) : (
            <VStack spacing={3} align="stretch">
              {invites.map((invite) => (
                <Box
                  key={invite.id}
                  p={4}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={invite.status === 'accepted' ? 'green.200' : 'gray.200'}
                  bg={invite.status === 'accepted' ? 'green.50' : 'gray.50'}
                >
                  <HStack justify="space-between" mb={2}>
                    <HStack>
                      <Badge colorScheme={invite.status === 'accepted' ? 'green' : 'yellow'}>
                        {invite.status === 'accepted' ? 'Aceito' : 'Pendente'}
                      </Badge>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">
                        {invite.inviteCode}
                      </Text>
                    </HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Icon as={FiCopy} />}
                      onClick={() => copyToClipboard(invite.inviteCode)}
                    >
                      Copiar
                    </Button>
                  </HStack>

                  {invite.status === 'accepted' && invite.acceptedByDriverName && (
                    <HStack spacing={2} fontSize="sm" color="green.600">
                      <Icon as={FiCheck} />
                      <Text>Aceito por {invite.acceptedByDriverName}</Text>
                    </HStack>
                  )}

                  {invite.email && (
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      Email: {invite.email}
                    </Text>
                  )}
                  {invite.phone && (
                    <Text fontSize="xs" color="gray.600">
                      Telefone: {invite.phone}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Motoristas Recrutados */}
      {network.recruitedDrivers.length > 0 && (
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
          <VStack align="stretch" spacing={4}>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color="gray.700">
                Motoristas Recrutados
              </Text>
              <Text fontSize="sm" color="gray.500">
                Motoristas que aceitaram seu convite
              </Text>
            </VStack>

            <Divider />

            <VStack spacing={3} align="stretch">
              {network.recruitedDrivers.map((driver) => (
                <Box
                  key={driver.driverId}
                  p={4}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="green.200"
                  bg="green.50"
                >
                  <HStack justify="space-between" mb={2}>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">
                        {driver.driverName}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Nível {driver.currentLevel}
                      </Text>
                    </VStack>
                    <Badge colorScheme="green">
                      {driver.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.600">
                    {driver.driverEmail}
                  </Text>
                </Box>
              ))}
            </VStack>
          </VStack>
        </Box>
      )}

      {/* Modal de Novo Convite */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Criar Novo Convite</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Email (opcional)</FormLabel>
                <Input
                  type="email"
                  placeholder="motorista@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Telefone (opcional)</FormLabel>
                <Input
                  type="tel"
                  placeholder="+351 912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </FormControl>

              <HStack spacing={2} width="full">
                <Button variant="ghost" onClick={onClose} flex={1}>
                  Cancelar
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleCreateInvite}
                  isLoading={isSubmitting}
                  flex={1}
                >
                  Criar Convite
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}

export const getServerSideProps = withDashboardSSR(
  { loadDriverData: false },
  async (context, user, driverId) => {
    return {};
  }
);

