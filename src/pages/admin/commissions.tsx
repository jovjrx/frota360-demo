import React, { useMemo } from 'react';
import { GetServerSideProps } from 'next';
import {
  VStack,
  Button,
  useDisclosure,
  useToast,
  Card,
  CardBody,
  Icon,
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr/withAdminSSR';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import AdminLayout from '@/components/layouts/AdminLayout';
import { CommissionsList } from '@/components/admin/commissions/CommissionsList';
import { CommissionModal } from '@/components/admin/commissions/CommissionModal';
import { useCommissionsData } from '@/hooks/useCommissionsData';
import type { CommissionRule } from '@/schemas/commission-rule';

interface AdminCommissionsPageProps extends AdminPageProps {
  initialCommissions?: CommissionRule[];
  tCommon?: any;
  tPage?: any;
}

function AdminCommissionsPageContent({
  translations,
  initialCommissions,
  locale,
  user,
  tCommon,
  tPage,
}: AdminCommissionsPageProps) {
  const toast = useToast();
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { commissions = initialCommissions || [], isLoading, mutate } = useCommissionsData();
  const [editingCommission, setEditingCommission] = React.useState<CommissionRule | null>(null);

  const handleOpenNew = () => {
    setEditingCommission(null);
    onOpen();
  };

  const handleEdit = (commission: CommissionRule) => {
    setEditingCommission(commission);
    onOpen();
  };

  const handleSuccess = async () => {
    await mutate();
    toast({
      title: t('success', 'Sucesso'),
      status: 'success',
      duration: 2000,
    });
  };

  const handleCloseModal = () => {
    setEditingCommission(null);
    onClose();
  };

  return (
    <AdminLayout
      translations={translations}
      title={t('title', 'Regras de Comissão')}
      subtitle={t('subtitle', 'Configure as regras de comissão para motoristas')}
      breadcrumbs={[{ label: tc('menu.commissions', 'Comissões') }]}
      side={
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="blue"
          size="sm"
          onClick={handleOpenNew}
        >
          {tc('actions.new', 'Nova')}
        </Button>
      }
    >
      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">

            <CommissionsList
              commissions={commissions || []}
              onEdit={handleEdit}
              translations={translations}
            />
          </VStack>
        </CardBody>
      </Card>

      <CommissionModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        editingCommission={editingCommission}
        translations={translations}
      />
    </AdminLayout>
  );
}

export default function AdminCommissionsPage(props: AdminCommissionsPageProps) {
  return <AdminCommissionsPageContent {...props} />;
}

export const getServerSideProps: GetServerSideProps<AdminCommissionsPageProps> = withAdminSSR();
