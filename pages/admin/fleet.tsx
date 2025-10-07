/**
 * Frota
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

interface FleetProps extends AdminPageProps {
  // Adicione props específicas aqui
}

export default function Fleet({ user, translations, locale }: FleetProps) {
  const t = (key: string) => translations.admin[key] || key;

  return (
    <AdminLayout
      title="Frota"
      subtitle="Gerencie veículos e frotas"
      breadcrumbs={[
        { label: 'Frota' }
      ]}
    >
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <Text>Conteúdo da página Frota</Text>
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
