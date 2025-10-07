/**
 * Usuários
 * Usa withAdminSSR para autenticação, traduções e dados via SSR
 */

import {
  Box,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
} from '@chakra-ui/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';

interface UsersProps extends AdminPageProps {
  // Adicione props específicas aqui
}

export default function Users({ user, translations, locale }: UsersProps) {
  const t = (key: string) => translations.admin[key] || key;

  return (
    <AdminLayout
      title="Usuários"
      subtitle="Gerencie usuários do sistema"
      breadcrumbs={[
        { label: 'Usuários' }
      ]}
    >
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <Text>Conteúdo da página Usuários</Text>
            <Text fontSize="sm" color="gray.600">
              Usuário: {user.email}
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </AdminLayout>
  );
}

// SSR com autenticação e traduções
export const getServerSideProps = withAdminSSR(async (context, user) => {
  // Adicione queries específicas aqui
  return {};
});
