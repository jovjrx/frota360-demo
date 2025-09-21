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
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useToast,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { FiSave, FiEdit, FiUser, FiMail, FiPhone, FiCalendar, FiMapPin } from 'react-icons/fi';
import { loadTranslations } from '@/lib/translations';
import StandardLayout from '@/components/layouts/StandardLayout';
import StandardModal from '@/components/modals/StandardModal';
import { useState } from 'react';

interface DriverProfileProps {
  driver: any;
  translations: Record<string, any>;
  userData: any;
}

export default function DriverProfile({ 
  driver, 
  translations,
  userData
}: DriverProfileProps) {
  const tCommon = (key: string) => translations.common?.[key] || key;
  const tDriver = (key: string) => translations.driver?.[key] || key;
  const toast = useToast();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: driver?.firstName || '',
    lastName: driver?.lastName || '',
    email: driver?.email || '',
    phone: driver?.phone || '',
    birthDate: driver?.birthDate || '',
    city: driver?.city || '',
    licenseNumber: driver?.licenseNumber || '',
    licenseExpiry: driver?.licenseExpiry || '',
    vehicleType: driver?.vehicleType || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // Implementar salvamento
      console.log('Salvando perfil:', formData);
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      throw new Error('Erro ao salvar perfil');
    }
  };

  return (
    <>
      <Head>
        <title>Perfil - Conduz.pt</title>
      </Head>
      
      <StandardLayout
        title="Meu Perfil"
        subtitle="Gerencie suas informações pessoais"
        user={{
          name: driver?.name || 'Motorista',
          avatar: driver?.avatar,
          role: 'driver',
          status: driver?.status
        }}
        notifications={0}
        actions={
          <Button 
            leftIcon={<FiEdit />} 
            colorScheme="blue"
            onClick={() => setIsEditModalOpen(true)}
          >
            Editar Perfil
          </Button>
        }
      >
        {/* Profile Overview */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Informações Pessoais</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={6} align="flex-start">
              <Avatar 
                size="2xl" 
                name={driver?.name || 'Motorista'} 
                src={driver?.avatar}
                bg="green.500"
              />
              <VStack align="flex-start" spacing={4} flex={1}>
                <Box>
                  <Text fontSize="lg" fontWeight="bold">
                    {driver?.firstName} {driver?.lastName}
                  </Text>
                  <Text color="gray.600">{driver?.email}</Text>
                  <HStack mt={2}>
                    <Badge colorScheme="green">Motorista Ativo</Badge>
                    <Badge colorScheme="blue">{driver?.vehicleType || 'Veículo não informado'}</Badge>
                  </HStack>
                </Box>
                
                <VStack align="flex-start" spacing={2}>
                  <HStack>
                    <FiPhone size={16} />
                    <Text fontSize="sm">{driver?.phone || 'Telefone não informado'}</Text>
                  </HStack>
                  <HStack>
                    <FiMapPin size={16} />
                    <Text fontSize="sm">{driver?.city || 'Cidade não informada'}</Text>
                  </HStack>
                  <HStack>
                    <FiCalendar size={16} />
                    <Text fontSize="sm">
                      Nascimento: {driver?.birthDate || 'Data não informada'}
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Driver Information */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Informações de Condução</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">Número da Carta de Condução:</Text>
                <Text>{driver?.licenseNumber || 'Não informado'}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="medium">Validade da Carta:</Text>
                <Text>{driver?.licenseExpiry || 'Não informada'}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="medium">Tipo de Veículo:</Text>
                <Text>{driver?.vehicleType || 'Não informado'}</Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Edit Profile Modal */}
        <StandardModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Editar Perfil"
          onSave={handleSave}
          saveText="Salvar Alterações"
        >
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Nome</FormLabel>
              <Input 
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Sobrenome</FormLabel>
              <Input 
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Telefone</FormLabel>
              <Input 
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Data de Nascimento</FormLabel>
              <Input 
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Cidade</FormLabel>
              <Input 
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Número da Carta de Condução</FormLabel>
              <Input 
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Validade da Carta</FormLabel>
              <Input 
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Tipo de Veículo</FormLabel>
              <Select 
                value={formData.vehicleType}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
              >
                <option value="">Selecione o tipo</option>
                <option value="carro">Carro</option>
                <option value="moto">Moto</option>
                <option value="van">Van</option>
                <option value="outro">Outro</option>
              </Select>
            </FormControl>
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
      firstName: 'João',
      lastName: 'Silva',
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '+351 912 345 678',
      birthDate: '1985-03-15',
      city: 'Lisboa',
      licenseNumber: '123456789',
      licenseExpiry: '2025-03-15',
      vehicleType: 'carro',
      status: 'active',
      avatar: null,
    };

    return {
      props: {
        driver,
        translations,
        userData: driver,
      },
    };
  } catch (error) {
    console.error('Error loading driver profile:', error);
    return {
      props: {
        driver: null,
        translations: { common: {}, driver: {} },
        userData: null,
      },
    };
  }
};