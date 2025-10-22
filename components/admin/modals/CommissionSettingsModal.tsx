import React, { useEffect, useState } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Stack, FormControl, FormLabel, Input, Select, SimpleGrid, useToast, Box } from '@chakra-ui/react';

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
        maxLevels: Math.max(1, Math.min(10, cfg.maxLevels)),
        levels: Object.fromEntries(Array.from({ length: Math.max(1, Math.min(10, cfg.maxLevels)) }, (_, i) => {
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={!loading}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Configuração de Comissões</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel>Elegibilidade (EUR/Semana)</FormLabel>
                <Input type="number" step="1" min={0} value={cfg.minWeeklyRevenueForEligibility}
                  onChange={(e) => setCfg({ ...cfg, minWeeklyRevenueForEligibility: Math.max(0, Number(e.target.value)) })} />
              </FormControl>
              <FormControl>
                <FormLabel>Base</FormLabel>
                <Input value="Repasse (após despesas)" isReadOnly />
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
                  <Input type="number" step="1" min={0} max={100}
                    value={cfg.levels[level] !== undefined ? Math.round(cfg.levels[level] * 100) : 0}
                    onChange={(e) => onChangeLevel(level, Math.max(0, Math.min(100, Number(e.target.value))) / 100)}
                  />
                </FormControl>
              ))}
            </SimpleGrid>
          </Stack>
          <Box mt={6} p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
            Motorista X indicou Motorista Y. Se Y atingir a elegibilidade, X recebe {cfg.levels[1] ? `${Math.round(cfg.levels[1] * 100)}%` : '0%'} do repasse de Y. Se houver Nível 2, o indicador do X recebe {cfg.levels[2] ? `${Math.round(cfg.levels[2] * 100)}%` : '0%'} e assim por diante.
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={loading}>Cancelar</Button>
          <Button colorScheme="blue" onClick={save} isLoading={loading}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
