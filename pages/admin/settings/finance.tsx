import { useEffect, useState } from 'react';
import { Box, Button, Flex, FormControl, FormHelperText, FormLabel, Heading, Input, Select, Stack, Switch, Text, useToast } from '@chakra-ui/react';

interface FinancialConfigDto {
  adminFeePercent: number;
  financing?: {
    dynamicCalculation?: boolean;
    eligibilityPolicy?: 'startDateToWeekEnd' | 'startDateToWeekStart';
    paymentDecrementDynamic?: boolean;
  };
}

export default function FinanceSettingsPage() {
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

  useEffect(() => { load(); }, []);

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
    <Flex p={8} maxW="720px" mx="auto" direction="column" gap={6}>
      <Heading size="lg">Finance Settings</Heading>
      <Text color="gray.600">Configure the company Admin Fee (applies over Net after VAT) and other financial settings.</Text>
      <Box borderWidth="1px" borderRadius="md" p={6}>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>Admin Fee (%)</FormLabel>
            <Input type="number" step="0.1" value={cfg.adminFeePercent}
              onChange={(e) => setCfg({ ...cfg, adminFeePercent: Number(e.target.value) })} />
          </FormControl>

          <Box borderWidth="1px" borderRadius="md" p={4}>
            <Heading size="sm" mb={3}>Financing Settings</Heading>
            <Stack spacing={3}>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb="0">Dynamic weekly calculation</FormLabel>
                <Switch isChecked={!!cfg.financing?.dynamicCalculation}
                  onChange={(e) => setCfg({
                    ...cfg,
                    financing: { ...cfg.financing, dynamicCalculation: e.target.checked },
                  })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Eligibility policy</FormLabel>
                <Select value={cfg.financing?.eligibilityPolicy || 'startDateToWeekEnd'}
                  onChange={(e) => setCfg({
                    ...cfg,
                    financing: { ...cfg.financing, eligibilityPolicy: e.target.value as any },
                  })}
                >
                  <option value="startDateToWeekEnd">startDate ≤ weekEnd (default)</option>
                  <option value="startDateToWeekStart">startDate ≤ weekStart</option>
                </Select>
                <FormHelperText>
                  Define when a week becomes eligible to charge the first installment based on financing start date.
                </FormHelperText>
              </FormControl>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb="0">Decrement on payment using dynamic eligibility</FormLabel>
                <Switch isChecked={!!cfg.financing?.paymentDecrementDynamic}
                  onChange={(e) => setCfg({
                    ...cfg,
                    financing: { ...cfg.financing, paymentDecrementDynamic: e.target.checked },
                  })}
                />
              </FormControl>
            </Stack>
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
