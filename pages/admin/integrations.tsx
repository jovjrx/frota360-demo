import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';

function IntegrationsPage({ tCommon, tPage }: AdminPageProps) {
  return (
    <AdminLayout
      title={tPage('integrations.title', 'Integrações')}
      subtitle={tPage('integrations.subtitle', 'Gerencie suas integrações com serviços externos')}
      breadcrumbs={[{ label: tPage('integrations.breadcrumb', 'Integrações') }]}
    >
      <VStack spacing={4} align="stretch">
        <Box p={5} shadow="md" borderWidth="1px">
          <Heading fontSize="xl">Cartrack</Heading>
          <Text mt={4}>Integração com a API da Cartrack para monitoramento de frota.</Text>
          <Text mt={2} color="gray.500">Status: Não configurado</Text>
        </Box>
        <Box p={5} shadow="md" borderWidth="1px">
          <Heading fontSize="xl">Bolt</Heading>
          <Text mt={4}>Atualmente, não há uma API pública da Bolt para integração direta de dados de frota.</Text>
          <Text mt={2} color="gray.500">Status: Indisponível</Text>
        </Box>
        {/* Adicionar mais integrações aqui */}
      </VStack>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async () => {
  return {};
});

export default IntegrationsPage;
