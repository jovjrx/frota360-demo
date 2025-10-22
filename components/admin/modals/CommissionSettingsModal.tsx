import React, { useEffect, useState } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Stack, FormControl, FormLabel, Input, Select, SimpleGrid, useToast } from '@chakra-ui/react';

type BaseOption = 'repasse' | 'ganhosMenosIVA';

interface CommissionConfigDto {
  minWeeklyRevenueForEligibility: number;
  base: BaseOption;
  maxLevels: number;
  levels: Record<number, number>; // decimal percents ex: 0.02
}

const DEFAULT_CFG: CommissionConfigDto = {
  minWeeklyRevenueForEligibility: 550,
  base: 'repasse',
  maxLevels: 3,
  levels: { 1: 0.02, 2: 0.01, 3: 0.005 },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommissionSettingsModal({ isOpen, onClose }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState<CommissionConfigDto>(DEFAULT_CFG);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/commissions');
      const data = await res.json();
      if (data?.success) setCfg(data.config as CommissionConfigDto);
    } catch (e) {
      toast({ status: 'error', title: 'Falha ao carregar config' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const onChangeLevel = (level: number, value: number) => {
    setCfg(prev => ({ ...prev, levels: { ...prev.levels, [level]: value } }));
  };

  const save = async () => {
    setLoading(true);
    try {
      const payload = {
        ...cfg,
        levels: Object.fromEntries(Array.from({ length: cfg.maxLevels }, (_, i) => {
          const level = i + 1;
          return [String(level), cfg.levels[level] || 0];
        })),
      } as any;
      const res = await fetch('/api/admin/settings/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        <ModalHeader>Configurações de Comissões</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel>Elegibilidade (EUR/Semana)</FormLabel>
                <Input type="number" step="1" value={cfg.minWeeklyRevenueForEligibility}
                  onChange={(e) => setCfg({ ...cfg, minWeeklyRevenueForEligibility: Number(e.target.value) })} />
              </FormControl>
              <FormControl>
                <FormLabel>Base</FormLabel>
                <Select value={cfg.base} onChange={(e) => setCfg({ ...cfg, base: e.target.value as BaseOption })}>
                  <option value="repasse">Repasse (após despesas)</option>
                  <option value="ganhosMenosIVA">Ganhos - IVA (6%)</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Níveis Máximos</FormLabel>
                <Input type="number" min={1} max={10} value={cfg.maxLevels}
                  onChange={(e) => setCfg({ ...cfg, maxLevels: Math.max(1, Math.min(10, Number(e.target.value))) })} />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
              {Array.from({ length: cfg.maxLevels }, (_, i) => i + 1).map(level => (
                <FormControl key={level}>
                  <FormLabel>Nível {level}</FormLabel>
                  <Input type="number" step="0.001" min={0} max={1}
                    value={cfg.levels[level] ?? 0}
                    onChange={(e) => onChangeLevel(level, Number(e.target.value))}
                  />
                </FormControl>
              ))}
            </SimpleGrid>
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
