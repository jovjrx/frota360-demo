import React, { useEffect } from 'react';
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
  Select,
  NumberInput,
  NumberInputField,
  VStack,
  useToast,
  Switch,
  HStack,
  NumberInputStepper,
  Textarea,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import type { CommissionRule } from '@/schemas/commission-rule';
import { createCommissionAPI, updateCommissionAPI } from '@/hooks/useCommissionsData';

interface CommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  editingCommission: CommissionRule | null;
  translations?: Record<string, any>;
}

export function CommissionModal({
  isOpen,
  onClose,
  onSuccess,
  editingCommission,
  translations,
}: CommissionModalProps) {
  const toast = useToast();
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<any>();

  useEffect(() => {
    if (editingCommission) {
      reset(editingCommission);
    } else {
      reset({
        type: 'base',
        level: 1,
        percentage: 0,
        value: 0,
        descricao: '',
        ativo: true,
      });
    }
  }, [editingCommission, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (editingCommission?.id) {
        await updateCommissionAPI(editingCommission.id, data);
        toast({ title: 'Comissão atualizada!', status: 'success' });
      } else {
        await createCommissionAPI(data);
        toast({ title: 'Comissão criada!', status: 'success' });
      }
      await onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: (error as Error).message,
        status: 'error',
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {editingCommission ? 'Editar Comissão' : 'Nova Comissão'}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Tipo</FormLabel>
                <Select {...register('type')}>
                  <option value="base">Base (sobre ganhos próprios)</option>
                  <option value="recruitment">Recrutamento (sobre indicados)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Nível</FormLabel>
                <Select {...register('level')}>
                  <option value="1">Nível 1 (Bronze)</option>
                  <option value="2">Nível 2 (Silver)</option>
                  <option value="3">Nível 3 (Gold)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Percentual (%)</FormLabel>
                <NumberInput min={0} max={100}>
                  <NumberInputField {...register('percentage')} />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Valor Fixo (€) - Opcional</FormLabel>
                <NumberInput min={0} step={0.01}>
                  <NumberInputField {...register('value')} />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Descrição</FormLabel>
                <Textarea {...register('descricao')} placeholder="Descrição da regra..." />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Ativa</FormLabel>
                <Switch {...register('ativo')} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
              Salvar
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
