import React from 'react';
import { Badge, BadgeProps } from '@chakra-ui/react';

export type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'paid' 
  | 'unpaid' 
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'success'
  | 'error'
  | 'warning';

interface StatusBadgeProps extends Omit<BadgeProps, 'colorScheme'> {
  status: StatusType;
  label?: string;
}

/**
 * Componente de Badge padronizado para diferentes status
 * Garante consistência visual em toda aplicação
 * 
 * @example
 * <StatusBadge status="active" />
 * <StatusBadge status="paid" label="Pago em 15/10" />
 * <StatusBadge status="pending" />
 */
export function StatusBadge({ status, label, ...props }: StatusBadgeProps) {
  const statusConfig: Record<StatusType, { colorScheme: string; defaultLabel: string }> = {
    active: {
      colorScheme: 'green',
      defaultLabel: 'Ativo',
    },
    inactive: {
      colorScheme: 'gray',
      defaultLabel: 'Inativo',
    },
    pending: {
      colorScheme: 'yellow',
      defaultLabel: 'Pendente',
    },
    paid: {
      colorScheme: 'green',
      defaultLabel: 'Pago',
    },
    unpaid: {
      colorScheme: 'red',
      defaultLabel: 'Não Pago',
    },
    processing: {
      colorScheme: 'blue',
      defaultLabel: 'Processando',
    },
    approved: {
      colorScheme: 'green',
      defaultLabel: 'Aprovado',
    },
    rejected: {
      colorScheme: 'red',
      defaultLabel: 'Rejeitado',
    },
    success: {
      colorScheme: 'green',
      defaultLabel: 'Sucesso',
    },
    error: {
      colorScheme: 'red',
      defaultLabel: 'Erro',
    },
    warning: {
      colorScheme: 'orange',
      defaultLabel: 'Atenção',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge colorScheme={config.colorScheme} {...props}>
      {label || config.defaultLabel}
    </Badge>
  );
}

/**
 * Badge para status de pagamento
 */
export function PaymentStatusBadge({ 
  status, 
  ...props 
}: { status: 'paid' | 'pending' | 'processing' } & Omit<BadgeProps, 'colorScheme'>) {
  return <StatusBadge status={status} {...props} />;
}

/**
 * Badge para status de motorista
 */
export function DriverStatusBadge({ 
  status, 
  ...props 
}: { status: 'active' | 'inactive' } & Omit<BadgeProps, 'colorScheme'>) {
  return <StatusBadge status={status} {...props} />;
}


