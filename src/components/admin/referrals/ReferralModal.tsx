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
  Textarea,
  VStack,
  useToast,
  Switch,
  HStack,
  Text,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import type { ReferralRule } from '@/schemas/referral-rule';
import { createReferralRuleAPI, updateReferralRuleAPI } from '@/hooks/useReferralRulesData';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  editingReferral: ReferralRule | null;
  translations?: Record<string, any>;
}

export function ReferralModal({
  isOpen,
  onClose,
  onSuccess,
  editingReferral,
  translations,
}: ReferralModalProps) {
  const toast = useToast();
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<any>();
  const criterioType = watch('criterioType');

  useEffect(() => {
    if (editingReferral) {
      reset(editingReferral);
    } else {
      reset({
        valueType: 'fixed',
        value: 50,
        criterioType: 'immediately',
        weeksToWait: 0,
        minWeeksActive: 1,
        descricao: '',
        ativo: true,
      });
    }
  }, [editingReferral, reset]);

  const onSubmit = async (data: any) => {
    try {
      // Converter strings para números
      const formattedData = {
        ...data,
        value: parseFloat(data.value) || 0,
        weeksToWait: parseInt(data.weeksToWait) || 0,
        minWeeksActive: parseInt(data.minWeeksActive) || 1,
      };

      if (editingReferral?.id) {
        await updateReferralRuleAPI(editingReferral.id, formattedData);
        toast({ title: 'Regra atualizada!', status: 'success' });
      } else {
        await createReferralRuleAPI(formattedData);
        toast({ title: 'Regra criada!', status: 'success' });
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
          {editingReferral ? 'Editar Regra de Indicação' : 'Nova Regra de Indicação'}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Tipo de Valor</FormLabel>
                <Select {...register('valueType')}>
                  <option value="fixed">Valor Fixo (€)</option>
                  <option value="percentage">Percentual (%)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Valor</FormLabel>
                <NumberInput min={0} step={0.01}>
                  <NumberInputField {...register('value')} />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Quando receber o bônus?</FormLabel>
                <Select {...register('criterioType')}>
                  <option value="immediately">Imediatamente</option>
                  <option value="after_weeks">Após N semanas</option>
                </Select>
              </FormControl>

              {criterioType === 'after_weeks' && (
                <FormControl>
                  <FormLabel>Número de Semanas para Aguardar</FormLabel>
                  <NumberInput min={0}>
                    <NumberInputField {...register('weeksToWait')} />
                  </NumberInput>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Mínimo de Semanas Ativo</FormLabel>
                <NumberInput min={1}>
                  <NumberInputField {...register('minWeeksActive')} />
                </NumberInput>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Motorista indicado deve estar ativo por no mínimo X semanas para receber o bônus
                </Text>
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
