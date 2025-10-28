import Stripe from 'stripe';

export class BillingAdapter {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });
  }

  async createCustomer(data: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }) {
    const customer = await this.stripe.customers.create({
      email: data.email,
      name: data.name,
      phone: data.phone,
      metadata: data.metadata,
    });

    return {
      id: customer.id,
      customerId: customer.id,
    };
  }

  async createSubscription(data: {
    customerId: string;
    priceId: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }) {
    const subscription = await this.stripe.subscriptions.create({
      customer: data.customerId,
      items: [{ price: data.priceId }],
      trial_period_days: data.trialDays,
      metadata: data.metadata,
      expand: ['latest_invoice'],
    });

    return {
      id: subscription.id,
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: (subscription as any).current_period_start * 1000,
      currentPeriodEnd: (subscription as any).current_period_end * 1000,
    };
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
    const subscription = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    return {
      id: subscription.id,
      status: subscription.status,
      canceledAt: subscription.canceled_at ? subscription.canceled_at * 1000 : undefined,
    };
  }

  async updateSubscription(subscriptionId: string, data: {
    priceId?: string;
    metadata?: Record<string, string>;
  }) {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    
    if (data.priceId) {
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: data.priceId,
        }],
        proration_behavior: 'create_prorations',
        metadata: data.metadata,
      });

      return {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodStart: (updatedSubscription as any).current_period_start * 1000,
        currentPeriodEnd: (updatedSubscription as any).current_period_end * 1000,
      };
    }

    const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
      metadata: data.metadata,
    });

    return {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      currentPeriodStart: (updatedSubscription as any).current_period_start * 1000,
      currentPeriodEnd: (updatedSubscription as any).current_period_end * 1000,
    };
  }

  async createInvoice(data: {
    customerId: string;
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, string>;
  }) {
    const invoice = await this.stripe.invoices.create({
      customer: data.customerId,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      metadata: data.metadata,
      auto_advance: false,
    } as any);

    return {
      id: invoice.id,
      invoiceId: invoice.id,
      status: invoice.status || 'draft',
      amount: invoice.amount_due,
      currency: invoice.currency,
      url: invoice.hosted_invoice_url || undefined,
    };
  }

  async getInvoice(invoiceId: string) {
    const invoice = await this.stripe.invoices.retrieve(invoiceId);

    return {
      id: invoice.id,
      status: invoice.status || 'draft',
      amount: invoice.amount_due,
      currency: invoice.currency,
      url: invoice.hosted_invoice_url || undefined,
      paidAt: invoice.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : undefined,
    };
  }

  async createPaymentMethod(data: {
    type: string;
    card?: {
      number: string;
      expMonth: number;
      expYear: number;
      cvc: string;
    };
  }) {
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card: data.card,
    });

    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
    };
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  async listPaymentMethods(customerId: string) {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      last4: pm.card?.last4,
      brand: pm.card?.brand,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
    }));
  }

  async createPrice(data: {
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    productId: string;
    metadata?: Record<string, string>;
  }) {
    const price = await this.stripe.prices.create({
      unit_amount: data.amount,
      currency: data.currency,
      recurring: { interval: data.interval },
      product: data.productId,
      metadata: data.metadata,
    });

    return {
      id: price.id,
      priceId: price.id,
      amount: price.unit_amount || 0,
      currency: price.currency,
      interval: price.recurring?.interval || 'month',
    };
  }

  async createProduct(data: {
    name: string;
    description?: string;
    metadata?: Record<string, string>;
  }) {
    const product = await this.stripe.products.create({
      name: data.name,
      description: data.description,
      metadata: data.metadata,
    });

    return {
      id: product.id,
      productId: product.id,
      name: product.name,
    };
  }

  async webhook(eventType: string, eventData: any) {
    switch (eventType) {
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(eventData);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(eventData);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(eventData);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(eventData);
        break;
      default:
        console.log(`Unhandled Stripe event: ${eventType}`);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log('Invoice payment succeeded:', invoice.id);
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    console.log('Invoice payment failed:', invoice.id);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    console.log('Subscription updated:', subscription.id);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    console.log('Subscription deleted:', subscription.id);
  }
}

