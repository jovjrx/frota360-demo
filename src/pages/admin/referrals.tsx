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
import { ReferralsList } from '@/components/admin/referrals/ReferralsList';
import { ReferralModal } from '@/components/admin/referrals/ReferralModal';
import { useReferralRulesData } from '@/hooks/useReferralRulesData';
import type { ReferralRule } from '@/schemas/referral-rule';

interface AdminReferralsPageProps extends AdminPageProps {
  initialReferrals?: ReferralRule[];
  tCommon?: any;
  tPage?: any;
}

function AdminReferralsPageContent({
  translations,
  initialReferrals,
  locale,
  user,
  tCommon,
  tPage,
}: AdminReferralsPageProps) {
  const toast = useToast();
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { referrals = initialReferrals || [], isLoading, mutate } = useReferralRulesData();
  const [editingReferral, setEditingReferral] = React.useState<ReferralRule | null>(null);

  const handleOpenNew = () => {
    setEditingReferral(null);
    onOpen();
  };

  const handleEdit = (referral: ReferralRule) => {
    setEditingReferral(referral);
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
    setEditingReferral(null);
    onClose();
  };

  return (
    <AdminLayout
      translations={translations}
      title={t('title', 'Regras de Indicação')}
      subtitle={t('subtitle', 'Configure as regras de bônus por indicação')}
      breadcrumbs={[{ label: tc('menu.referrals', 'Indicações') }]}
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
          <ReferralsList
            referrals={referrals || []}
            onEdit={handleEdit}
            translations={translations}
          />
        </CardBody>
      </Card>

      <ReferralModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        editingReferral={editingReferral}
        translations={translations}
      />
    </AdminLayout>
  );
}

export default function AdminReferralsPage(props: AdminReferralsPageProps) {
  return <AdminReferralsPageContent {...props} />;
}

export const getServerSideProps: GetServerSideProps<AdminReferralsPageProps> = withAdminSSR();
