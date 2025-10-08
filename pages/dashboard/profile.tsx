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
import DriverLayout from '@/components/layouts/DriverLayout';
import StandardModal from '@/components/modals/StandardModal';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { formatPortugalTime } from '@/lib/timezone';

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
  const router = useRouter();
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
      const response = await fetch("/api/painel/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || tDriver("profile.messages.errorSaving"));
      }

      toast({
        title: tDriver("profile.messages.profileUpdated"),
        description: tDriver("profile.messages.profileUpdatedDesc"),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditModalOpen(false); // Close modal on success
      router.reload(); // Reload page to show updated data
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: tDriver("profile.messages.error"),
        description: error.message || tDriver("profile.messages.errorSaving"),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <Head>
        <title>{`${tDriver('profile.title')} - Conduz.pt`}</title>
      </Head>
      
      <DriverLayout
        title={tDriver('profile.title')}
        subtitle={tDriver('profile.subtitle')}
        user={{
          name: driver?.name || 'Motorista',
          avatar: driver?.avatar,
          role: 'driver',
          status: driver?.status
        }}
        notifications={0}
        breadcrumbs={[
          { label: 'Dashboard', href: '/drivers' },
          { label: tDriver('profile.title') }
        ]}
        actions={
          <Button 
            leftIcon={<FiEdit />} 
            colorScheme="blue"
            onClick={() => setIsEditModalOpen(true)}
          >
            {tDriver('profile.editProfile')}
          </Button>
        }
      >
        {/* Profile Overview */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">{tDriver('profile.personalInfo')}</Heading>
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
                    <Badge colorScheme="green">{tDriver('profile.activeDriver')}</Badge>
                    <Badge colorScheme="blue">{driver?.vehicleType || tDriver('profile.vehicleNotInformed')}</Badge>
                  </HStack>
                </Box>
                
                <VStack align="flex-start" spacing={2}>
                  <HStack>
                    <FiPhone size={16} />
                    <Text fontSize="sm">{driver?.phone || tDriver('profile.phoneNotInformed')}</Text>
                  </HStack>
                  <HStack>
                    <FiMapPin size={16} />
                    <Text fontSize="sm">{driver?.city || tDriver('profile.cityNotInformed')}</Text>
                  </HStack>
                  <HStack>
                    <FiCalendar size={16} />
                    <Text fontSize="sm">
                      {tDriver('profile.birthDate')}: {driver?.birthDate || tDriver('profile.birthNotInformed')}
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
            <Heading size="md">{tDriver('profile.drivingInfo')}</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">{tDriver('profile.licenseNumber')}:</Text>
                <Text>{driver?.licenseNumber || tDriver('profile.notInformed')}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="medium">{tDriver('profile.licenseValidity')}:</Text>
                <Text>{driver?.licenseExpiry || tDriver('profile.notInformed')}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="medium">{tDriver('profile.vehicleType')}:</Text>
                <Text>{driver?.vehicleType || tDriver('profile.notInformed')}</Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Edit Profile Modal */}
        <StandardModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={tDriver('profile.editProfile')}
          onSave={handleSave}
          saveText={tDriver('profile.saveChanges')}
        >
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>{tDriver('profile.firstName')}</FormLabel>
              <Input 
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>{tDriver('profile.lastName')}</FormLabel>
              <Input 
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>{tDriver('profile.email')}</FormLabel>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>{tDriver('profile.phone')}</FormLabel>
              <Input 
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>{tDriver('profile.birthDate')}</FormLabel>
              <Input 
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>{tDriver('profile.city')}</FormLabel>
              <Input 
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>{tDriver('profile.licenseNumberField')}</FormLabel>
              <Input 
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>{tDriver('profile.licenseExpiry')}</FormLabel>
              <Input 
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>{tDriver('profile.vehicleType')}</FormLabel>
              <Select 
                value={formData.vehicleType}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
              >
                <option value="">{tDriver('profile.selectType')}</option>
                <option value="carro">{tDriver('profile.car')}</option>
                <option value="moto">{tDriver('profile.motorcycle')}</option>
                <option value="van">{tDriver('profile.van')}</option>
                <option value="outro">{tDriver('profile.other')}</option>
              </Select>
            </FormControl>
          </VStack>
        </StandardModal>
      </DriverLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Extract locale from middleware header
    const locale = Array.isArray(context.req.headers['x-locale']) 
      ? context.req.headers['x-locale'][0] 
      : context.req.headers['x-locale'] || 'pt';
    
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
    } as any;

    // Verificar se o motorista completou o onboarding
    const hasSelectedPlan = driver.selectedPlan && driver.selectedPlan !== null;
    const documentsUploaded = driver.documents ? 
      Object.values(driver.documents).filter((doc: any) => doc.uploaded).length : 0;
    
    // Se não completou o onboarding, redirecionar
    if (!hasSelectedPlan || documentsUploaded === 0) {
      return {
        redirect: {
          destination: '/drivers/onboarding',
          permanent: false,
        },
      };
    }

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