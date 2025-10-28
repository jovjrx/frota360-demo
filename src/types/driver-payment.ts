/**
 * DriverPayment - Type único centralizado
 * Usado em TODA parte do código que referencia pagamentos de motoristas
 */

export interface WeeklyNormalizedData {
  id: string;
  weekId: string;
  weekStart?: string;
  weekEnd?: string;
  platform: 'uber' | 'bolt' | 'myprio' | 'viaverde' | 'cartrack';
  referenceId: string;
  referenceLabel?: string;
  driverId: string;
  driverName: string;
  vehiclePlate?: string | null;
  totalValue: number;
  totalTrips: number;
  rawDataRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancingDetails {
  type: 'discount' | 'loan';
  amount: number;
  weeklyAmount: number;
  weeklyInterest: number;
  displayAmount: number;
  totalCost: number;
  hasFinancing: boolean;
  isParcelado: boolean;
  displayLabel?: string;
  totalParcelas?: number;
  parcelasAteAgora?: number;
  parcelasRestantes?: number;
  percentualPago?: number;
  dataUltimaParcela?: string;
  onusBancario?: number;
  onusParcelado?: number;
  weeklyWithFees?: number;
  // Legado (compatibilidade)
  interestPercent?: number;
  installment?: number;
  interestAmount?: number;
}

/**
 * DriverPaymentSnapshot - Snapshot MINIMALISTA
 * APENAS dados de INPUT (o que foi usado para CALCULAR)
 * Permite reprocessamento se houver bug
 * NÃO duplica dados já no top-level
 */
export interface DriverPaymentSnapshot {
  // Metadata
  driverId: string;
  driverName: string;
  weekId: string;
  type: 'affiliate' | 'renter';

  // Dados de entrada (para recalcular se precisar)
  ganhosTotal: number;
  ivaValor: number;
  combustivel: number;
  viaverde: number;
  aluguel: number;

  // Financiamento (se houver) - precisa pra reprocessar
  financingDetails?: {
    interestPercent?: number;
    onusPercent?: number;
    installment?: number;
  };
}

export interface DriverPaymentRecordSnapshot extends DriverPaymentSnapshot {
  // Para compatibilidade com código antigo que espera mais campos
  platformData?: WeeklyNormalizedData[];
}

export interface DriverPayment {
  id: string;
  recordId: string;
  driverId: string;
  driverName: string;
  weekId: string;
  weekStart?: string;
  weekEnd?: string;
  currency: 'EUR';
  baseAmount: number;
  baseAmountCents: number;
  bonusAmount: number;
  bonusCents: number;
  discountAmount: number;
  discountCents: number;
  totalAmount: number;
  totalAmountCents: number;
  iban?: string;
  paymentDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    uid?: string;
    email?: string;
    name?: string;
  };
  recordSnapshot: DriverPaymentRecordSnapshot;
  // Dados de taxa ADM
  adminFeePercentage: number;
  adminFeeValue: number;
  adminFeeCents: number;
  // Despesas
  combustivel: number;
  portagens: number;
  aluguel: number;
  // Comprovante
  proofUrl?: string;
  proofStoragePath?: string;
  proofFileName?: string;
  proofFileSize?: number;
  proofContentType?: string;
  proofUploadedAt?: string;
  // Bônus processados
  bonusMetaPaid?: Array<any>;
  referralBonusPaid?: Array<any>;
  commissionPaid?: any;
  bonusesMarked?: Array<{ type: string; count: number; totalAmount: number }>;
  financingProcessed?: Array<{
    financingId: string;
    type: string;
    amount: number;
    installmentPaid: number;
    remainingInstallments: number;
    completed: boolean;
    recordId: string;
  }>;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled';
  [key: string]: any; // Para campos adicionais que possam vir do Firestore
}

export interface ProcessingResult {
  success: boolean;
  driverId: string;
  driverName: string;
  weekId: string;
  payment?: DriverPayment;
  error?: string;
  warnings?: string[];
}
