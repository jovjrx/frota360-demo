import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  SimpleGrid,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  Divider,
  Switch,
  InputGroup,
  InputLeftAddon,
  Code,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';

export default function AddDriver() {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [loading, setLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    driverId: string;
  } | null>(null);

  // Dados pessoais
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');

  // Tipo
  const [type, setType] = useState<'affiliate' | 'renter'>('affiliate');

  // Dados bancários
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Veículo (se locatário)
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [rentalFee, setRentalFee] = useState('');

  // Integrações
  const [uberUuid, setUberUuid] = useState('');
  const [boltDriverId, setBoltDriverId] = useState('');
  const [myprioEnabled, setMyprioEnabled] = useState(false);
  const [viaverdeEnabled, setViaverdeEnabled] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName || !lastName || !email || !phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    if (type === 'renter' && (!vehiclePlate || !vehicleModel)) {
      toast({
        title: 'Dados do veículo obrigatórios',
        description: 'Para locatários, informe a matrícula e modelo do veículo',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/admin/drivers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          birthDate: birthDate || null,
          city,
          type,
          iban,
          accountHolder: accountHolder || `${firstName} ${lastName}`,
          vehiclePlate: type === 'renter' ? vehiclePlate : null,
          vehicleModel: type === 'renter' ? vehicleModel : null,
          rentalFee: type === 'renter' ? parseFloat(rentalFee) || 0 : 0,
          uberUuid,
          boltDriverId,
          myprioEnabled,
          viaverdeEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar motorista');
      }

      // Mostrar credenciais geradas
      setCreatedCredentials({
        email: data.email,
        password: data.temporaryPassword,
        driverId: data.driverId,
      });
      onOpen();

      toast({
        title: 'Motorista criado com sucesso!',
        description: 'Credenciais geradas. Copie e envie ao motorista.',
        status: 'success',
        duration: 5000,
      });

    } catch (error: any) {
      console.error('Erro ao criar motorista:', error);
      toast({
        title: 'Erro ao criar motorista',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCloseModal() {
    onClose();
    router.push('/admin/drivers');
  }

  return (
    <AdminLayout 
      title="Adicionar Motorista"
      subtitle="Cadastrar novo motorista diretamente"
      breadcrumbs={[
        { label: 'Motoristas', href: '/admin/drivers' },
        { label: 'Adicionar' }
      ]}
    >
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            {/* Dados Pessoais */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                Dados Pessoais
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nome</FormLabel>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="João"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Sobrenome</FormLabel>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Silva"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joao@email.com"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Telefone</FormLabel>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+351 912 345 678"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Cidade</FormLabel>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lisboa"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Tipo de Motorista */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                Tipo de Motorista
              </Text>
              <FormControl isRequired>
                <FormLabel>Tipo</FormLabel>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'affiliate' | 'renter')}
                >
                  <option value="affiliate">Afiliado (Veículo Próprio)</option>
                  <option value="renter">Locatário (Veículo da Empresa)</option>
                </Select>
              </FormControl>
            </Box>

            <Divider />

            {/* Dados Bancários */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                Dados Bancários
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>IBAN</FormLabel>
                  <Input
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="PT50003300004555698867005"
                    fontFamily="mono"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Titular da Conta</FormLabel>
                  <Input
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Nome completo"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            {/* Veículo (se locatário) */}
            {type === 'renter' && (
              <>
                <Divider />
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={4}>
                    Dados do Veículo
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Matrícula</FormLabel>
                      <Input
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                        placeholder="AB-12-CD"
                        fontFamily="mono"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Modelo</FormLabel>
                      <Input
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="Toyota Corolla"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Aluguel Semanal (€)</FormLabel>
                      <InputGroup>
                        <InputLeftAddon>€</InputLeftAddon>
                        <Input
                          type="number"
                          step="0.01"
                          value={rentalFee}
                          onChange={(e) => setRentalFee(e.target.value)}
                          placeholder="290.00"
                        />
                      </InputGroup>
                    </FormControl>
                  </SimpleGrid>
                </Box>
              </>
            )}

            <Divider />

            {/* Integrações */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                Integrações (Opcional)
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>Uber UUID</FormLabel>
                  <Input
                    value={uberUuid}
                    onChange={(e) => setUberUuid(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    fontFamily="mono"
                    fontSize="sm"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Bolt Driver ID</FormLabel>
                  <Input
                    value={boltDriverId}
                    onChange={(e) => setBoltDriverId(e.target.value)}
                    placeholder="12345678"
                    fontFamily="mono"
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">myprio Habilitado</FormLabel>
                  <Switch
                    isChecked={myprioEnabled}
                    onChange={(e) => setMyprioEnabled(e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">ViaVerde Habilitado</FormLabel>
                  <Switch
                    isChecked={viaverdeEnabled}
                    onChange={(e) => setViaverdeEnabled(e.target.checked)}
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Botões */}
            <HStack spacing={4} justify="flex-end">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/drivers')}
                isDisabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                colorScheme="red"
                isLoading={loading}
                loadingText="Criando..."
              >
                Criar Motorista
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>

      {/* Modal de Credenciais */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} size="lg" closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Motorista Criado com Sucesso!</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="success">
                <AlertIcon />
                <Box>
                  <AlertTitle>Conta criada no Firebase Auth</AlertTitle>
                  <AlertDescription fontSize="sm">
                    O motorista já pode fazer login no painel.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box>
                <Text fontSize="md" fontWeight="bold" mb={2}>
                  Credenciais de Acesso:
                </Text>
                <VStack spacing={2} align="stretch" bg="gray.50" p={4} borderRadius="md">
                  <Box>
                    <Text fontSize="sm" color="gray.600">Email:</Text>
                    <Code fontSize="md" p={2} w="full">
                      {createdCredentials?.email}
                    </Code>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Senha Temporária:</Text>
                    <Code fontSize="md" p={2} w="full" colorScheme="red">
                      {createdCredentials?.password}
                    </Code>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">ID do Motorista:</Text>
                    <Code fontSize="xs" p={2} w="full">
                      {createdCredentials?.driverId}
                    </Code>
                  </Box>
                </VStack>
              </Box>

              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">Importante!</AlertTitle>
                  <AlertDescription fontSize="sm">
                    Copie essas credenciais e envie ao motorista por email ou WhatsApp.
                    Esta senha não será mostrada novamente.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box>
                <Text fontSize="sm" color="gray.600">
                  <strong>Link de acesso:</strong> https://conduz.pt/painel
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="red" onClick={handleCloseModal}>
              Fechar e Ir para Lista
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
