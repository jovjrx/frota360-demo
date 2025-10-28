export * from '../schemas/driver';
export * from '../schemas/vehicle';
export * from '../schemas/plan';
export * from '../schemas/subscription';
export * from '../schemas/billing';
export * from '../schemas/uber';
export * from '../schemas/payout';
export * from '../schemas/audit';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'ops' | 'driver';
  driverId?: string;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: number;
  livemode: boolean;
}

export interface CommissionRule {
  driverId?: string;
  percent: number;
  minAmount?: number;
  maxAmount?: number;
  conditions?: Record<string, any>;
}

export interface PayoutPeriod {
  start: number;
  end: number;
  label: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface NotificationData {
  type: 'email' | 'push' | 'in_app';
  recipient: string;
  template: string;
  data: Record<string, any>;
  scheduledAt?: number;
}


export interface DriverWeeklySummary {
  weekStart: string;
  weekEnd: string;
  grossEarnings: number;
  netEarnings: number;
  totalExpenses: number;
  uberEarnings: number;
  boltEarnings: number;
  prioExpenses: number;
  viaverdeExpenses: number;
  ivaAmount: number;
  adminFee: number;
  rent: number;
  // Add other relevant fields as needed
}


