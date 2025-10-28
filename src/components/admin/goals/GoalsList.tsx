import React from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import type { Goal } from '@/schemas/goal';
import { deleteGoalAPI } from '@/hooks/useGoalsData';

interface GoalsListProps {
  goals: Goal[];
  onEdit: (goal: Goal) => void;
  onRefresh?: () => void;
  translations?: any;
}

const t = (key: string, translations?: any, fallback: string = '') => {
  if (!translations) return fallback;
  const keys = key.split('.');
  let value: any = translations;
  for (const k of keys) {
    value = value?.[k];
  }
  return typeof value === 'string' ? value : fallback;
};

export function GoalsList({ goals, onEdit, onRefresh, translations }: GoalsListProps) {
  const toast = useToast();
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const handleDelete = async (goalId: string) => {
    if (!confirm(t('admin.goals.confirmDelete', translations, 'Confirmar exclusão?'))) return;

    setDeleting(goalId);
    try {
      await deleteGoalAPI(goalId);
      toast({
        title: t('admin.goals.deletedSuccess', translations, 'Goal deletada com sucesso'),
        status: 'success',
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: t('admin.goals.deleteError', translations, 'Erro ao deletar'),
        description: (error as Error).message,
        status: 'error',
      });
    } finally {
      setDeleting(null);
    }
  };

  if (goals.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        {t('admin.goals.empty', translations, 'Nenhuma meta/recompensa configurada')}
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>{t('admin.goals.description', translations, 'Descrição')}</Th>
            <Th>{t('admin.goals.criteria', translations, 'Critério')}</Th>
            <Th>{t('admin.goals.goal', translations, 'Meta')}</Th>
            <Th>{t('admin.goals.reward', translations, 'Recompensa')}</Th>
            <Th>{t('admin.goals.type', translations, 'Tipo')}</Th>
            <Th>{t('admin.goals.level', translations, 'Nível')}</Th>
            <Th>{t('admin.goals.status', translations, 'Status')}</Th>
            <Th>{t('admin.goals.actions', translations, 'Ações')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {goals.map((goal) => (
            <Tr key={goal.id}>
              <Td fontSize="sm">{goal.descricao}</Td>
              <Td>
                <Badge colorScheme={goal.criterio === 'ganho' ? 'green' : 'blue'}>
                  {goal.criterio === 'ganho' ? '€' : '🚗'}
                </Badge>
              </Td>
              <Td>
                {goal.criterio === 'ganho' ? `€${goal.valor.toFixed(2)}` : `${goal.valor} viagens`}
              </Td>
              <Td>
                {goal.tipo === 'valor'
                  ? `€${goal.recompensa.toFixed(2)}`
                  : `${goal.recompensa}%`}
              </Td>
              <Td>
                <Badge colorScheme={goal.tipo === 'valor' ? 'purple' : 'orange'}>
                  {goal.tipo === 'valor' ? 'Fixo' : 'Percentual'}
                </Badge>
              </Td>
              <Td>{goal.nivel}</Td>
              <Td>
                <Badge colorScheme={goal.ativo ? 'green' : 'gray'}>
                  {goal.ativo ? t('admin.goals.active', translations, 'Ativo') : t('admin.goals.inactive', translations, 'Inativo')}
                </Badge>
              </Td>
              <Td>
                <HStack spacing={2}>
                  <IconButton
                    aria-label={t('admin.goals.edit', translations, 'Editar')}
                    icon={<FiEdit2 />}
                    size="sm"
                    onClick={() => onEdit(goal)}
                  />
                  <IconButton
                    aria-label={t('admin.goals.delete', translations, 'Deletar')}
                    icon={<FiTrash2 />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    isLoading={deleting === goal.id}
                    onClick={() => handleDelete(goal.id)}
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
