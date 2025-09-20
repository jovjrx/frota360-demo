import nodemailer from 'nodemailer';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isMock: boolean;

  constructor() {
    this.isMock = !this.hasSMTPConfig();
    if (!this.isMock) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  private hasSMTPConfig(): boolean {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  async sendEmail(data: EmailData): Promise<void> {
    if (this.isMock) {
      console.log('Mock email sent:', {
        to: data.to,
        subject: data.subject,
        html: data.html,
      });
      return;
    }

    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    await this.transporter.sendMail({
      from: data.from || process.env.SMTP_USER,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });
  }

  async sendDriverWelcomeEmail(driverEmail: string, driverName: string): Promise<void> {
    const template = this.getDriverWelcomeTemplate(driverName);
    await this.sendEmail({
      to: driverEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendDriverApprovalEmail(driverEmail: string, driverName: string): Promise<void> {
    const template = this.getDriverApprovalTemplate(driverName);
    await this.sendEmail({
      to: driverEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendDriverRejectionEmail(driverEmail: string, driverName: string, reason?: string): Promise<void> {
    const template = this.getDriverRejectionTemplate(driverName, reason);
    await this.sendEmail({
      to: driverEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPaymentFailedEmail(driverEmail: string, driverName: string, invoiceUrl?: string): Promise<void> {
    const template = this.getPaymentFailedTemplate(driverName, invoiceUrl);
    await this.sendEmail({
      to: driverEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendSubscriptionRenewalReminder(driverEmail: string, driverName: string, planName: string, renewalDate: Date): Promise<void> {
    const template = this.getSubscriptionRenewalTemplate(driverName, planName, renewalDate);
    await this.sendEmail({
      to: driverEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  private getDriverWelcomeTemplate(driverName: string): EmailTemplate {
    return {
      subject: 'Bem-vindo à Conduz.pt!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2D3748;">Bem-vindo à Conduz.pt!</h1>
          <p>Olá ${driverName},</p>
          <p>Obrigado por se inscrever na Conduz.pt! Sua conta foi criada com sucesso.</p>
          <p>Seu perfil está sendo analisado pela nossa equipe. Você receberá uma notificação assim que for aprovado.</p>
          <p>Enquanto isso, você pode acessar o painel do motorista para completar seu perfil e enviar os documentos necessários.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/painel" 
               style="background-color: #48BB78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Acessar Painel
            </a>
          </div>
          <p>Se você tiver alguma dúvida, não hesite em nos contatar.</p>
          <p>Equipe Conduz.pt</p>
        </div>
      `,
      text: `Bem-vindo à Conduz.pt!\n\nOlá ${driverName},\n\nObrigado por se inscrever na Conduz.pt! Sua conta foi criada com sucesso.\n\nSeu perfil está sendo analisado pela nossa equipe. Você receberá uma notificação assim que for aprovado.\n\nEnquanto isso, você pode acessar o painel do motorista para completar seu perfil e enviar os documentos necessários.\n\nAcesse: ${process.env.NEXT_PUBLIC_APP_URL}/painel\n\nSe você tiver alguma dúvida, não hesite em nos contatar.\n\nEquipe Conduz.pt`,
    };
  }

  private getDriverApprovalTemplate(driverName: string): EmailTemplate {
    return {
      subject: 'Sua conta foi aprovada - Conduz.pt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #48BB78;">Parabéns!</h1>
          <p>Olá ${driverName},</p>
          <p>Sua conta na Conduz.pt foi aprovada! 🎉</p>
          <p>Agora você pode começar a usar nossa plataforma. Acesse o painel do motorista para:</p>
          <ul>
            <li>Configurar sua disponibilidade</li>
            <li>Escolher um plano de assinatura</li>
            <li>Começar a receber corridas</li>
          </ul>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/painel" 
               style="background-color: #48BB78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Acessar Painel
            </a>
          </div>
          <p>Bem-vindo à equipe Conduz.pt!</p>
          <p>Equipe Conduz.pt</p>
        </div>
      `,
      text: `Parabéns!\n\nOlá ${driverName},\n\nSua conta na Conduz.pt foi aprovada! 🎉\n\nAgora você pode começar a usar nossa plataforma. Acesse o painel do motorista para:\n\n- Configurar sua disponibilidade\n- Escolher um plano de assinatura\n- Começar a receber corridas\n\nAcesse: ${process.env.NEXT_PUBLIC_APP_URL}/painel\n\nBem-vindo à equipe Conduz.pt!\n\nEquipe Conduz.pt`,
    };
  }

  private getDriverRejectionTemplate(driverName: string, reason?: string): EmailTemplate {
    return {
      subject: 'Atualização sobre sua conta - Conduz.pt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #E53E3E;">Conta não aprovada</h1>
          <p>Olá ${driverName},</p>
          <p>Infelizmente, sua conta na Conduz.pt não foi aprovada no momento.</p>
          ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
          <p>Você pode entrar em contato conosco para mais informações ou tentar novamente no futuro.</p>
          <div style="margin: 20px 0;">
            <a href="mailto:suporte@conduz.pt" 
               style="background-color: #3182CE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Contatar Suporte
            </a>
          </div>
          <p>Obrigado pelo seu interesse na Conduz.pt.</p>
          <p>Equipe Conduz.pt</p>
        </div>
      `,
      text: `Conta não aprovada\n\nOlá ${driverName},\n\nInfelizmente, sua conta na Conduz.pt não foi aprovada no momento.\n\n${reason ? `Motivo: ${reason}\n\n` : ''}Você pode entrar em contato conosco para mais informações ou tentar novamente no futuro.\n\nContato: suporte@conduz.pt\n\nObrigado pelo seu interesse na Conduz.pt.\n\nEquipe Conduz.pt`,
    };
  }

  private getPaymentFailedTemplate(driverName: string, invoiceUrl?: string): EmailTemplate {
    return {
      subject: 'Falha no pagamento - Conduz.pt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #E53E3E;">Falha no pagamento</h1>
          <p>Olá ${driverName},</p>
          <p>Houve um problema com o pagamento da sua assinatura.</p>
          <p>Por favor, atualize suas informações de pagamento para evitar a suspensão do serviço.</p>
          ${invoiceUrl ? `
            <div style="margin: 20px 0;">
              <a href="${invoiceUrl}" 
                 style="background-color: #3182CE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Atualizar Pagamento
              </a>
            </div>
          ` : ''}
          <p>Se você tiver dúvidas, entre em contato conosco.</p>
          <p>Equipe Conduz.pt</p>
        </div>
      `,
      text: `Falha no pagamento\n\nOlá ${driverName},\n\nHouve um problema com o pagamento da sua assinatura.\n\nPor favor, atualize suas informações de pagamento para evitar a suspensão do serviço.\n\n${invoiceUrl ? `Atualizar: ${invoiceUrl}\n\n` : ''}Se você tiver dúvidas, entre em contato conosco.\n\nEquipe Conduz.pt`,
    };
  }

  private getSubscriptionRenewalTemplate(driverName: string, planName: string, renewalDate: Date): EmailTemplate {
    const renewalDateStr = renewalDate.toLocaleDateString('pt-BR');
    
    return {
      subject: 'Renovação da assinatura em breve - Conduz.pt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #D69E2E;">Renovação em breve</h1>
          <p>Olá ${driverName},</p>
          <p>Sua assinatura do plano <strong>${planName}</strong> será renovada automaticamente em ${renewalDateStr}.</p>
          <p>Certifique-se de que seu método de pagamento está atualizado.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/painel/subscription" 
               style="background-color: #3182CE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Gerenciar Assinatura
            </a>
          </div>
          <p>Se você não deseja renovar, pode cancelar a qualquer momento.</p>
          <p>Equipe Conduz.pt</p>
        </div>
      `,
      text: `Renovação em breve\n\nOlá ${driverName},\n\nSua assinatura do plano ${planName} será renovada automaticamente em ${renewalDateStr}.\n\nCertifique-se de que seu método de pagamento está atualizado.\n\nGerenciar: ${process.env.NEXT_PUBLIC_APP_URL}/painel/subscription\n\nSe você não deseja renovar, pode cancelar a qualquer momento.\n\nEquipe Conduz.pt`,
    };
  }
}

export const emailService = new EmailService();
