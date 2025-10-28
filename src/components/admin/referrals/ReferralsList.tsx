import React, { useState } from 'react';
import { HStack, IconButton } from '@chakra-ui/react';
import { FiTrash2 } from 'react-icons/fi';
import GlobalTable, { GlobalTableColumn, GlobalTableBadge } from '../GlobalTable';
import type { ReferralRule } from '@/schemas/referral-rule';

interface ReferralRuleWithUsage extends ReferralRule {
  usageCount?: number;
}

interface ReferralsListProps {
  referrals: ReferralRuleWithUsage[];
  onEdit: (referral: ReferralRuleWithUsage) => void;
  onDelete?: (id: string) => Promise<void>;
  translations?: Record<string, any>;
}

export function ReferralsList({
  referrals,
  onEdit,
  onDelete,
  translations,
}: ReferralsListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    if (!window.confirm('Tem certeza que deseja deletar esta regra de indicação?')) return;

    try {
      setIsDeleting(id);
      await onDelete(id);
    } finally {
      setIsDeleting(null);
    }
  };

  const columns: GlobalTableColumn[] = [
    {
      key: 'valueType',
      label: 'Tipo',
      render: (value) => (
        value === 'fixed' ? '💶 Fixo' : '% Percentual'
      ),
    },
    {
      key: 'value',
      label: 'Valor',
      isNumeric: true,
      render: (value, item: any) => {
        const rule = item as ReferralRuleWithUsage;
        return rule.valueType === 'fixed' ? `€${value.toFixed(2)}` : `${value}%`;
      },
    },
    {
      key: 'criterioType',
      label: 'Critério',
      render: (value) =>
        value === 'immediately' ? '⚡ Imediato' : '⏱️ Após semanas',
    },
    {
      key: 'weeksToWait',
      label: 'Semanas',
      isNumeric: true,
    },
    {
      key: 'usageCount',
      label: 'Em Uso',
      isNumeric: true,
    },
  ];

  const getBadges = (item: ReferralRuleWithUsage): GlobalTableBadge[] => [
    {
      label: item.ativo ? 'Ativa' : 'Inativa',
      colorScheme: item.ativo ? 'green' : 'gray',
    },
  ];

  const getActions = (item: ReferralRuleWithUsage) => (
    <HStack spacing={1}>
      {onDelete && (
        <IconButton
          aria-label="Deletar"
          icon={<FiTrash2 />}
          size="sm"
          colorScheme="red"
          variant="ghost"
          isLoading={isDeleting === item.id}
          onClick={() => handleDelete(item.id!)}
        />
      )}
    </HStack>
  );

  return (
    <GlobalTable
      items={referrals}
      columns={columns}
      badges={getBadges}
      actions={getActions}
      onEdit={onEdit}
      emptyMessage={translations?.admin?.referrals?.empty || 'Nenhuma regra de indicação configurada'}
    />
  );
}
