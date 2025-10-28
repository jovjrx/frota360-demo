import { BillingAdapter } from './stripe';

export interface BillingProvider {
  createCustomer(data: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }): Promise<{ id: string; customerId: string }>;
  
  createSubscription(data: {
    customerId: string;
    priceId: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    subscriptionId: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
  }>;
  
  cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<{
    id: string;
    status: string;
    canceledAt?: number;
  }>;
  
  updateSubscription(subscriptionId: string, data: {
    priceId?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
  }>;
  
  createInvoice(data: {
    customerId: string;
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    id?: string;
    invoiceId?: string;
    status: string;
    amount: number;
    currency: string;
    url?: string;
  }>;
  
  getInvoice(invoiceId: string): Promise<{
    id?: string;
    status: string;
    amount: number;
    currency: string;
    url?: string;
    paidAt?: number;
  }>;
  
  createPaymentMethod(data: {
    type: string;
    card?: {
      number: string;
      expMonth: number;
      expYear: number;
      cvc: string;
    };
  }): Promise<{
    id: string;
    type: string;
    last4?: string;
    brand?: string;
  }>;
  
  attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<void>;
  
  listPaymentMethods(customerId: string): Promise<Array<{
    id: string;
    type: string;
    last4?: string;
    brand?: string;
    expMonth?: number;
    expYear?: number;
  }>>;
  
  createPrice(data: {
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    productId: string;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    priceId: string;
    amount: number;
    currency: string;
    interval: string;
  }>;
  
  createProduct(data: {
    name: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    productId: string;
    name: string;
  }>;
  
  webhook(eventType: string, eventData: any): Promise<void>;
}

function createBillingProvider(): BillingProvider {
  // Sempre usa Stripe
  return new BillingAdapter();
}

export const billingProvider = createBillingProvider();

