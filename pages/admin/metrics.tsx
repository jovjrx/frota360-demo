/**
 * Métricas
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

interface MetricsProps extends AdminPageProps {
  // Adicione props específicas aqui
}

export default function Metrics({ user, translations, locale }: MetricsProps) {
  const t = (key: string) => translations.admin[key] || key;

  return (
    <AdminLayout
      title="Métricas"
      subtitle="Gerencie métricas e análises"
      breadcrumbs={[
        { label: 'Métricas' }
      ]}
    >
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <Text>Conteúdo da página Métricas</Text>
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
