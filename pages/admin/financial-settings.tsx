import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useDisclosure,
  Icon,
} from '@chakra-ui/react';
import { FiDollarSign, FiSettings } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminFeeConfigModal from '@/components/admin/AdminFeeConfigModal';
import { withAdminSSR } from '@/lib/ssr';
import { getFinancialConfig } from '@/lib/finance/config';

interface FinancialSettingsProps {
  user: any;
  locale: string;
  tCommon: any;
  tPage: any;
  translations: any;
  config: {
    adminFeePercent: number;
    adminFeeFixedDefault: number;
  };
}

export default function FinancialSettings({
  user,
  locale,
  tCommon,
  tPage,
  translations,
  config,
}: FinancialSettingsProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentConfig, setCurrentConfig] = useState(config);

  const handleModalClose = async () => {
    // Recarregar configuração após fechar o modal
    try {
      const res = await fetch('/api/admin/financial-config');
      if (res.ok) {
        const data = await res.json();
        setCurrentConfig(data);
      }
    } catch (error) {
      console.error('Erro ao recarregar configuração:', error);
    }
    onClose();
  };

  return (
    <AdminLayout
      title="Configurações Financeiras"
      subtitle="Gerencie os parâmetros financeiros do sistema"
      translations={translations}
    >
      <VStack spacing={6} align="stretch">
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">
                <Icon as={FiDollarSign} mr={2} />
                Taxa Administrativa Padrão
              </Heading>
              <Button
                leftIcon={<FiSettings />}
                colorScheme="blue"
                onClick={onOpen}
              >
                Configurar
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack spacing={8}>
                <Stat>
                  <StatLabel>Taxa Percentual Padrão</StatLabel>
                  <StatNumber>{currentConfig.adminFeePercent}%</StatNumber>
                  <StatHelpText>
                    Aplicado sobre (Ganhos - IVA) quando o motorista não tem taxa customizada
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>Valor Fixo Padrão</StatLabel>
                  <StatNumber>€{currentConfig.adminFeeFixedDefault.toFixed(2)}</StatNumber>
                  <StatHelpText>
                    Valor semanal quando o motorista escolhe taxa fixa sem customização
                  </StatHelpText>
                </Stat>
              </HStack>

              <Box p={4} bg="blue.50" borderRadius="md" borderWidth={1} borderColor="blue.200">
                <Text fontSize="sm" fontWeight="medium" color="blue.800">
                  ℹ️ Como funciona:
                </Text>
                <VStack align="start" mt={2} spacing={1}>
                  <Text fontSize="sm" color="blue.700">
                    • Cada motorista pode ter sua própria configuração de taxa administrativa
                  </Text>
                  <Text fontSize="sm" color="blue.700">
                    • Se o motorista não tiver configuração customizada, usa o percentual padrão ({currentConfig.adminFeePercent}%)
                  </Text>
                  <Text fontSize="sm" color="blue.700">
                    • Se o motorista escolher taxa fixa sem definir valor, usa €{currentConfig.adminFeeFixedDefault.toFixed(2)}
                  </Text>
                  <Text fontSize="sm" color="blue.700">
                    • Alterações só afetam pagamentos futuros
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      <AdminFeeConfigModal isOpen={isOpen} onClose={handleModalClose} />
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async (context, user) => {
  const config = await getFinancialConfig();
  
  return {
    config: {
      adminFeePercent: config.adminFeePercent,
      adminFeeFixedDefault: config.adminFeeFixedDefault,
    },
  };
});
