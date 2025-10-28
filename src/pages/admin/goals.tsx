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
import { GoalsList } from '@/components/admin/goals/GoalsList';
import { GoalModal } from '@/components/admin/goals/GoalModal';
import { useGoalsData } from '@/hooks/useGoalsData';
import type { Goal } from '@/schemas/goal';

interface AdminGoalsPageProps extends AdminPageProps {
  initialGoals?: Goal[];
  tCommon?: any;
  tPage?: any;
}

function AdminGoalsPageContent({
  translations,
  initialGoals,
  locale,
  user,
  tCommon,
  tPage,
}: AdminGoalsPageProps) {
  const toast = useToast();
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { goals = initialGoals || [], isLoading, mutate } = useGoalsData();
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);

  const handleOpenNew = () => {
    setEditingGoal(null);
    onOpen();
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
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
    setEditingGoal(null);
    onClose();
  };

  return (
    <AdminLayout
      translations={translations}
      title={t('title', 'Metas/Recompensas')}
      subtitle={t('subtitle', 'Veja as metas/recompensas configuradas atualmente para todos os motoristas.')}
      breadcrumbs={[{ label: tc('menu.goals', 'Metas & Recompensas') }]}
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

            <GoalsList
              goals={goals || []}
              onEdit={handleEdit}
              translations={translations}
            />
          </VStack>
        </CardBody>
      </Card>

      {/* Modal */}
      <GoalModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        editingGoal={editingGoal}
        translations={translations}
      />
    </AdminLayout>
  );
}

export default function AdminGoalsPage(props: AdminGoalsPageProps) {
  return <AdminGoalsPageContent {...props} />;
}

export const getServerSideProps: GetServerSideProps<AdminGoalsPageProps> = withAdminSSR();


