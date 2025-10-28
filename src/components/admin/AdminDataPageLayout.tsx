/**
 * COMPONENTE GENÉRICO DE LAYOUT PARA PÁGINAS ADMIN
 * 
 * Estrutura padrão:
 * - Header com stats em cards
 * - Filtros e busca
 * - Tabela de dados
 * - Ações em linha
 * 
 * Uso:
 * <AdminDataPageLayout
 *   title="Documentos"
 *   stats={[{ label: 'Total', value: 42, icon: FiFileText, color: 'blue' }]}
 *   filters={<YourFilters />}
 *   children={<YourTable />}
 * />
 */

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Grid,
  GridItem,
  HStack,
  Icon,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';

export interface StatCardConfig {
  label: string;
  value: number | string;
  helpText?: string;
  icon?: React.ComponentType;
  color?: string;
  colorScheme?: string;
}

export interface AdminDataPageLayoutProps {
  // Layout
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  translations?: any;

  // Stats
  stats: StatCardConfig[];

  // Ações
  actionButton?: {
    label: string;
    icon?: React.ComponentType;
    onClick: () => void;
    isLoading?: boolean;
  };

  // Filtros
  filters?: React.ReactNode;

  // Conteúdo principal (tabela, lista, etc)
  children: React.ReactNode;

  // Customização
  statsColumns?: number;
  contentSpacing?: number;
}

export const AdminDataPageLayout: React.FC<AdminDataPageLayoutProps> = ({
  title,
  subtitle,
  breadcrumbs = [{ label: title }],
  translations,
  stats,
  actionButton,
  filters,
  children,
  statsColumns = 4,
  contentSpacing = 6,
}) => {
  return (
    <AdminLayout
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      translations={translations}
      side={
        actionButton && (
          <Button
            leftIcon={actionButton.icon ? <Icon as={actionButton.icon} /> : <Icon as={FiPlus} />}
            colorScheme="blue"
            size="sm"
            onClick={actionButton.onClick}
            isLoading={actionButton.isLoading}
          >
            {actionButton.label}
          </Button>
        )
      }
    >
      <VStack spacing={contentSpacing} align="stretch">
        {/* Stats Cards */}
        {stats && stats.length > 0 && (
          <>
            <Grid templateColumns={{ base: '1fr', md: `repeat(${statsColumns}, 1fr)` }} gap={4}>
              {stats.map((stat, idx) => (
                <GridItem key={idx}>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel display="flex" alignItems="center">
                          {stat.icon && <Icon as={stat.icon} mr={2} />}
                          {stat.label}
                        </StatLabel>
                        <StatNumber color={stat.color || 'inherit'}>
                          {stat.value}
                        </StatNumber>
                        {stat.helpText && (
                          <StatHelpText>{stat.helpText}</StatHelpText>
                        )}
                      </Stat>
                    </CardBody>
                  </Card>
                </GridItem>
              ))}
            </Grid>
            <Divider />
          </>
        )}

        {/* Filters */}
        {filters && (
          <>
            <Box>{filters}</Box>
            <Divider />
          </>
        )}

        {/* Main Content */}
        <Box>{children}</Box>
      </VStack>
    </AdminLayout>
  );
};

export default AdminDataPageLayout;

