import { useEffect, useState } from 'react';
import { Box, Button, Flex, FormControl, FormLabel, Heading, Input, Select, Stack, Text, useToast, SimpleGrid } from '@chakra-ui/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';

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

function CommissionSettingsPageContent() {
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

  useEffect(() => { load(); }, []);

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
        setCfg(data.config);
        toast({ status: 'success', title: 'Configuração salva' });
      } else {
        toast({ status: 'error', title: data?.error || 'Erro ao salvar' });
      }
    } catch (e) {
      toast({ status: 'error', title: 'Erro de rede ao salvar' });
    } finally {
      setLoading(false);
    }
  };

  const onChangeLevel = (level: number, value: number) => {
    setCfg(prev => ({ ...prev, levels: { ...prev.levels, [level]: value } }));
  };

  return (
    <Flex p={0} maxW="920px" mx="auto" direction="column" gap={6}>
      <Heading size="lg">Commission Settings</Heading>
      <Text color="gray.600">Configure multi-level driver commissions. Levels use decimal percentages (e.g., 0.02 = 2%).</Text>

      <Box borderWidth="1px" borderRadius="md" p={6}>
        <Stack spacing={4}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <FormControl>
              <FormLabel>Eligibility Threshold (EUR)</FormLabel>
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
              <FormLabel>Max Levels</FormLabel>
              <Input type="number" min={1} max={10} value={cfg.maxLevels}
                onChange={(e) => setCfg({ ...cfg, maxLevels: Math.max(1, Math.min(10, Number(e.target.value))) })} />
            </FormControl>
          </SimpleGrid>

          <Box>
            <Heading size="sm" mb={3}>Level Percentages (decimal)</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
              {Array.from({ length: cfg.maxLevels }, (_, i) => i + 1).map(level => (
                <FormControl key={level}>
                  <FormLabel>Level {level}</FormLabel>
                  <Input type="number" step="0.001" min={0} max={1}
                    value={cfg.levels[level] ?? 0}
                    onChange={(e) => onChangeLevel(level, Number(e.target.value))}
                  />
                </FormControl>
              ))}
            </SimpleGrid>
          </Box>

          <Flex gap={3}>
            <Button onClick={load} isLoading={loading} variant="outline">Recarregar</Button>
            <Button colorScheme="blue" onClick={save} isLoading={loading}>Salvar</Button>
          </Flex>
        </Stack>
      </Box>
    </Flex>
  );
}

export default function CommissionSettingsPage({ translations }: AdminPageProps) {
  return (
    <AdminLayout title="Configurações de Comissões" translations={translations}>
      <CommissionSettingsPageContent />
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async () => ({ }));
