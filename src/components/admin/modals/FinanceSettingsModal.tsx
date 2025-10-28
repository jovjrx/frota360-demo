import React, { useEffect, useState } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Stack, Box, Heading, FormControl, FormLabel, FormHelperText, Input, Select, Switch, useToast } from '@chakra-ui/react';

interface FinancialConfigDto {
  adminFeePercent: number;
  financing?: {
    dynamicCalculation?: boolean;
    eligibilityPolicy?: 'startDateToWeekEnd' | 'startDateToWeekStart';
    paymentDecrementDynamic?: boolean;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FinanceSettingsModal({ isOpen, onClose }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState<FinancialConfigDto>({ adminFeePercent: 7, financing: { dynamicCalculation: true, eligibilityPolicy: 'startDateToWeekEnd', paymentDecrementDynamic: true } });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/finance');
      const data = await res.json();
      if (data?.success) setCfg({
        adminFeePercent: data.config.adminFeePercent ?? 7,
        financing: {
          dynamicCalculation: data.config.financing?.dynamicCalculation ?? true,
          eligibilityPolicy: data.config.financing?.eligibilityPolicy ?? 'startDateToWeekEnd',
          paymentDecrementDynamic: data.config.financing?.paymentDecrementDynamic ?? true,
        },
      });
    } catch (e) {
      toast({ status: 'error', title: 'Falha ao carregar config' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (data?.success) {
        toast({ status: 'success', title: 'Configuração salva' });
        onClose();
      } else {
        toast({ status: 'error', title: data?.error || 'Erro ao salvar' });
      }
    } catch (e) {
      toast({ status: 'error', title: 'Erro de rede ao salvar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Configurações Financeiras</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Admin Fee (%)</FormLabel>
              <Input type="number" step="0.1" value={cfg.adminFeePercent}
                onChange={(e) => setCfg({ ...cfg, adminFeePercent: Number(e.target.value) })} />
            </FormControl>

            <Box borderWidth="1px" borderRadius="md" p={4}>
              <Heading size="sm" mb={3}>Financiamentos</Heading>
              <Stack spacing={3}>
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel mb="0">Cálculo semanal dinâmico</FormLabel>
                  <Switch isChecked={!!cfg.financing?.dynamicCalculation}
                    onChange={(e) => setCfg({
                      ...cfg,
                      financing: { ...cfg.financing, dynamicCalculation: e.target.checked },
                    })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Política de elegibilidade</FormLabel>
                  <Select value={cfg.financing?.eligibilityPolicy || 'startDateToWeekEnd'}
                    onChange={(e) => setCfg({
                      ...cfg,
                      financing: { ...cfg.financing, eligibilityPolicy: e.target.value as any },
                    })}
                  >
                    <option value="startDateToWeekEnd">startDate ≤ weekEnd (padrão)</option>
                    <option value="startDateToWeekStart">startDate ≤ weekStart</option>
                  </Select>
                  <FormHelperText>
                    Define quando a semana torna-se elegível para cobrar a primeira parcela.
                  </FormHelperText>
                </FormControl>
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel mb="0">Decremento no pagamento com elegibilidade dinâmica</FormLabel>
                  <Switch isChecked={!!cfg.financing?.paymentDecrementDynamic}
                    onChange={(e) => setCfg({
                      ...cfg,
                      financing: { ...cfg.financing, paymentDecrementDynamic: e.target.checked },
                    })}
                  />
                </FormControl>
              </Stack>
            </Box>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="blue" onClick={save} isLoading={loading}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

