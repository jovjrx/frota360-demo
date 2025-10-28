import { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  useToast,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';

interface Financing {
  id?: string;
  driverId?: string;
  type?: 'loan' | 'discount';
  amount?: number;
  weeks?: number | null;
  weeklyInterest?: number;
  startDate?: string;
  endDate?: string | null;
  status?: 'active' | 'completed';
  notes?: string | null;
}

interface Driver {
  id: string;
  fullName?: string;
  name?: string;
}

interface FinancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  financing?: Financing | null;
  drivers?: Driver[];
  onSave: (financingData: any) => Promise<void>;
  tCommon: any;
  tPage: any;
}

export default function FinancingModal({
  isOpen,
  onClose,
  financing,
  drivers = [],
  onSave,
  tCommon,
  tPage,
}: FinancingModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);
  
  const isEditMode = !!financing?.id;
  
  const [formData, setFormData] = useState({
    driverId: '',
    type: 'loan' as 'loan' | 'discount',
    amount: 0,
    weeks: null as number | null,
    weeklyInterest: 0,
    startDate: '',
    status: 'active' as 'active' | 'completed',
    notes: '',
  });

  // Preencher dados quando modal abrir
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && financing) {
        setFormData({
          driverId: financing.driverId || '',
          type: financing.type || 'loan',
          amount: financing.amount || 0,
          weeks: financing.weeks || null,
          weeklyInterest: financing.weeklyInterest || 0,
          // ✅ CORREÇÃO: Converter data para formato YYYY-MM-DD esperado pelo input type="date"
          startDate: financing.startDate 
            ? new Date(financing.startDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          status: financing.status || 'active',
          notes: financing.notes || '',
        });
      } else {
        // Reset para modo criação
        setFormData({
          driverId: '',
          type: 'loan',
          amount: 0,
          weeks: null,
          weeklyInterest: 0,
          startDate: new Date().toISOString().split('T')[0], // Data atual
          status: 'active',
          notes: '',
        });
      }
    }
  }, [isOpen, financing, isEditMode]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.driverId) {
      toast({
        title: t('financing.form.validation.driverRequired', 'Motorista é obrigatório'),
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      toast({
        title: t('financing.form.validation.amountRequired', 'Valor deve ser maior que zero'),
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        // Converter semanas para null se não especificado
        weeks: formData.weeks || null,
      };

      // ✅ CORREÇÃO: Remover driverId do payload em modo edição para evitar alteração indevida
      if (isEditMode) {
        delete payload.driverId;
      }

      await onSave(payload);
      onClose();
      
    } catch (error: any) {
      toast({
        title: t(`financing.${isEditMode ? 'edit' : 'create'}.error`, `Erro ao ${isEditMode ? 'atualizar' : 'criar'} financiamento`),
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          {isEditMode 
            ? t('financing.edit.title', 'Editar Financiamento')
            : t('financing.create.title', 'Novo Financiamento')
          }
        </ModalHeader>
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Motorista */}
            <FormControl isRequired>
              <FormLabel>{t('financing.form.driver.label', 'Motorista')}</FormLabel>
              <Select
                value={formData.driverId}
                onChange={(e) => handleChange('driverId', e.target.value)}
                placeholder={t('financing.form.driver.placeholder', 'Selecione um motorista')}
                isDisabled={isEditMode} // Não permitir alterar motorista na edição
              >
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.fullName || driver.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Tipo */}
            <FormControl isRequired>
              <FormLabel>{t('financing.form.type.label', 'Tipo')}</FormLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                <option value="loan">{t('financing.types.loan', 'Empréstimo')}</option>
                <option value="discount">{t('financing.types.discount', 'Desconto')}</option>
              </Select>
            </FormControl>

            <HStack spacing={4} w="full">
              {/* Valor */}
              <FormControl isRequired flex="1">
                <FormLabel>{t('financing.form.amount.label', 'Valor (€)')}</FormLabel>
                <NumberInput
                  value={formData.amount}
                  onChange={(valueString, valueNumber) => handleChange('amount', valueNumber)}
                  min={0}
                  step={0.01}
                  precision={2}
                >
                  <NumberInputField placeholder="0.00" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              {/* Semanas */}
              <FormControl flex="1">
                <FormLabel>{t('financing.form.weeks.label', 'Semanas')}</FormLabel>
                <NumberInput
                  value={formData.weeks || ''}
                  onChange={(valueString, valueNumber) => handleChange('weeks', valueNumber || null)}
                  min={1}
                >
                  <NumberInputField placeholder={t('financing.form.weeks.placeholder', 'Opcional')} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </HStack>

            {/* Taxa de juros semanal */}
            <FormControl>
              <FormLabel>{t('financing.form.weeklyInterest.label', 'Taxa de juros semanal (%)')}</FormLabel>
              <NumberInput
                value={formData.weeklyInterest}
                onChange={(valueString, valueNumber) => handleChange('weeklyInterest', valueNumber)}
                min={0}
                max={100}
                step={0.1}
                precision={2}
              >
                <NumberInputField placeholder="0.00" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="xs" color="gray.600" mt={1}>
                {t('financing.form.weeklyInterest.description', 'Taxa de juros aplicada semanalmente (opcional)')}
              </Text>
            </FormControl>

            {/* Data de início */}
            <FormControl isRequired>
              <FormLabel>{t('financing.form.startDate.label', 'Data de início')}</FormLabel>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </FormControl>

            {/* Status */}
            <FormControl isRequired>
              <FormLabel>{t('financing.form.status.label', 'Status')}</FormLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="active">{t('financing.status.active', 'Ativo')}</option>
                <option value="completed">{t('financing.status.completed', 'Concluído')}</option>
              </Select>
            </FormControl>

            {/* Observações */}
            <FormControl>
              <FormLabel>{t('financing.form.notes.label', 'Observações')}</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder={t('financing.form.notes.placeholder', 'Observações sobre o financiamento...')}
                rows={3}
                resize="vertical"
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} w="full" justify="flex-end">
            <Button variant="ghost" onClick={onClose}>
              {tc('actions.cancel', 'Cancelar')}
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={loading}
            >
              {isEditMode 
                ? tc('actions.save', 'Guardar')
                : tc('actions.create', 'Criar')
              }
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

