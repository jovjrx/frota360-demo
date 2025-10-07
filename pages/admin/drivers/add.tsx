/**
 * Adicionar Motorista
 * Usa withAdminSSR para autenticação e traduções via SSR
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Heading,
  VStack,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  useToast,
  SimpleGrid,
} from '@chakra-ui/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';

interface AddDriverProps extends AdminPageProps {}

export default function AddDriver({ user, translations, locale }: AddDriverProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    type: 'affiliate' as 'affiliate' | 'renter',
    status: 'active',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/drivers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar motorista');
      }

      toast({
        title: 'Motorista criado com sucesso!',
        status: 'success',
        duration: 3000,
      });

      router.push('/admin/drivers');
    } catch (error) {
      toast({
        title: 'Erro ao criar motorista',
        description: 'Tente novamente',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Adicionar Motorista"
      subtitle="Cadastrar novo motorista no sistema"
      breadcrumbs={[
        { label: 'Motoristas', href: '/admin/drivers' },
        { label: 'Adicionar' }
      ]}
    >
      <Card maxW="800px">
        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Nome Completo</FormLabel>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="João Silva"
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="joao@email.com"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Telefone</FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+351 912 345 678"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                  >
                    <option value="affiliate">Afiliado</option>
                    <option value="renter">Locatário</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <Button
                type="submit"
                colorScheme="green"
                isLoading={loading}
                w="full"
              >
                Criar Motorista
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </AdminLayout>
  );
}

// SSR com autenticação e traduções
export const getServerSideProps = withAdminSSR();
