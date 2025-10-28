import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  HStack,
  VStack,
  Checkbox,
  useToast,
} from '@chakra-ui/react';
import type { Goal } from '@/schemas/goal';
import { createGoalAPI, updateGoalAPI } from '@/hooks/useGoalsData';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingGoal?: Goal | null;
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

export function GoalModal({
  isOpen,
  onClose,
  onSuccess,
  editingGoal,
  translations,
}: GoalModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    descricao: '',
    criterio: 'ganho' as 'ganho' | 'viagens',
    tipo: 'valor' as 'valor' | 'percentual',
    valor: 0,
    recompensa: 0,
    nivel: 1,
    ativo: true,
    dataInicio: '',
  });

  React.useEffect(() => {
    if (editingGoal) {
      setFormData({
        descricao: editingGoal.descricao,
        criterio: editingGoal.criterio,
        tipo: editingGoal.tipo,
        valor: editingGoal.valor,
        recompensa: editingGoal.recompensa,
        nivel: editingGoal.nivel,
        ativo: editingGoal.ativo,
        dataInicio: editingGoal.dataInicio || '',
      });
    } else {
      setFormData({
        descricao: '',
        criterio: 'ganho',
        tipo: 'valor',
        valor: 0,
        recompensa: 0,
        nivel: 1,
        ativo: true,
        dataInicio: '',
      });
    }
  }, [editingGoal, isOpen]);

  const handleSubmit = async () => {
    if (!formData.descricao || !formData.valor || !formData.recompensa) {
      toast({
        title: t('admin.goals.validation', translations, 'Preencha todos os campos obrigatórios'),
        status: 'warning',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (editingGoal) {
        await updateGoalAPI(editingGoal.id, formData);
        toast({
          title: t('admin.goals.updatedSuccess', translations, 'Goal atualizada com sucesso'),
          status: 'success',
        });
      } else {
        await createGoalAPI(formData);
        toast({
          title: t('admin.goals.createdSuccess', translations, 'Goal criada com sucesso'),
          status: 'success',
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: t('admin.goals.error', translations, 'Erro'),
        description: (error as Error).message,
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {editingGoal
            ? t('admin.goals.editGoal', translations, 'Editar Goal')
            : t('admin.goals.newGoal', translations, 'Nova Goal')}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>{t('admin.goals.description', translations, 'Descrição')}</FormLabel>
              <Input
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder={t('admin.goals.descriptionPlaceholder', translations, 'Ex: Atingir €500 em ganhos')}
              />
            </FormControl>

            <HStack spacing={4} w="full">
              <FormControl isRequired flex={1}>
                <FormLabel>{t('admin.goals.criteria', translations, 'Critério')}</FormLabel>
                <Select
                  value={formData.criterio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      criterio: e.target.value as 'ganho' | 'viagens',
                    })
                  }
                >
                  <option value="ganho">{t('admin.goals.earnings', translations, 'Ganhos €')}</option>
                  <option value="viagens">{t('admin.goals.trips', translations, 'Viagens')}</option>
                </Select>
              </FormControl>

              <FormControl isRequired flex={1}>
                <FormLabel>{t('admin.goals.goal', translations, 'Meta')}</FormLabel>
                <Input
                  type="number"
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl isRequired flex={1}>
                <FormLabel>{t('admin.goals.type', translations, 'Tipo Recompensa')}</FormLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo: e.target.value as 'valor' | 'percentual',
                    })
                  }
                >
                  <option value="valor">{t('admin.goals.fixed', translations, 'Valor Fixo €')}</option>
                  <option value="percentual">{t('admin.goals.percentage', translations, 'Percentual %')}</option>
                </Select>
              </FormControl>

              <FormControl isRequired flex={1}>
                <FormLabel>{t('admin.goals.reward', translations, 'Recompensa')}</FormLabel>
                <Input
                  type="number"
                  value={formData.recompensa}
                  onChange={(e) =>
                    setFormData({ ...formData, recompensa: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl flex={1}>
                <FormLabel>{t('admin.goals.level', translations, 'Nível (1-10)')}</FormLabel>
                <Select
                  value={formData.nivel}
                  onChange={(e) =>
                    setFormData({ ...formData, nivel: parseInt(e.target.value) || 1 })
                  }
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl flex={1}>
                <FormLabel>{t('admin.goals.startDate', translations, 'Data Início')}</FormLabel>
                <Input
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) =>
                    setFormData({ ...formData, dataInicio: e.target.value })
                  }
                />
              </FormControl>
            </HStack>

            <FormControl>
              <Checkbox
                isChecked={formData.ativo}
                onChange={(e) =>
                  setFormData({ ...formData, ativo: e.target.checked })
                }
              >
                {t('admin.goals.active', translations, 'Ativo')}
              </Checkbox>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t('admin.goals.cancel', translations, 'Cancelar')}
          </Button>
          <Button colorScheme="blue" isLoading={isLoading} onClick={handleSubmit}>
            {t('admin.goals.save', translations, 'Salvar')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
