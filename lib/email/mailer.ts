import type { Transporter } from 'nodemailer';
import { buildEmailTransporter, type EmailAttachments } from './transporter';

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
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachments;
}

class EmailService {
  private transporter: Transporter | null = null;
  private defaultFrom?: string;
  private isMock: boolean;

  constructor() {
    const { transporter, defaultFrom } = buildEmailTransporter();
    this.transporter = transporter;
    this.defaultFrom = defaultFrom;
    this.isMock = !transporter;
  }

  async sendEmail(data: EmailData): Promise<void> {
    if (this.isMock) {
      console.log('Mock email sent:', {
        to: data.to,
        subject: data.subject,
        html: data.html,
        attachments: data.attachments?.length ?? 0,
      });
      return;
    }

    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const fromAddress = data.from || this.defaultFrom;

    if (!fromAddress) {
      throw new Error('Email sender address is not configured');
    }

    await this.transporter.sendMail({
      from: fromAddress,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      replyTo: data.replyTo,
      cc: data.cc,
      bcc: data.bcc,
      attachments: data.attachments,
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

  async sendDriverCredentialsEmail(driverEmail: string, driverName: string, temporaryPassword: string): Promise<void> {
    const template = this.getDriverCredentialsTemplate(driverName, driverEmail, temporaryPassword);
    await this.sendEmail({
      to: driverEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail(driverEmail: string, driverName: string, resetToken: string): Promise<void> {
    const template = this.getPasswordResetTemplate(driverName, resetToken);
    await this.sendEmail({
      to: driverEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordChangedEmail(driverEmail: string, driverName: string, newPassword: string): Promise<void> {
    const template = this.getPasswordChangedTemplate(driverName, newPassword);
    await this.sendEmail({
      to: driverEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  private getDriverWelcomeTemplate(driverName: string): EmailTemplate {
    return {
      subject: 'Bem-vindo à Frota360.pt!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2D3748;">Bem-vindo à Frota360.pt!</h1>
          <p>Olá ${driverName},</p>
          <p>Obrigado por se inscrever na Frota360.pt! Sua conta foi criada com sucesso.</p>
          <p>Seu perfil está sendo analisado pela nossa equipe. Você receberá uma notificação assim que for aprovado.</p>
          <p>Enquanto isso, você pode acessar o painel do motorista para completar seu perfil e enviar os documentos necessários.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL}/painel" 
               style="background-color: #48BB78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Acessar Painel
            </a>
          </div>
          <p>Se você tiver alguma dúvida, não hesite em nos contatar.</p>
          <p>Equipe Frota360.pt</p>
        </div>
      `,
      text: `Bem-vindo à Frota360.pt!\n\nOlá ${driverName},\n\nObrigado por se inscrever na Frota360.pt! Sua conta foi criada com sucesso.\n\nSeu perfil está sendo analisado pela nossa equipe. Você receberá uma notificação assim que for aprovado.\n\nEnquanto isso, você pode acessar o painel do motorista para completar seu perfil e enviar os documentos necessários.\n\nAcesse: ${process.env.NEXTAUTH_URL}/painel\n\nSe você tiver alguma dúvida, não hesite em nos contatar.\n\nEquipe Frota360.pt`,
    };
  }

  private getDriverApprovalTemplate(driverName: string): EmailTemplate {
    return {
      subject: 'Sua conta foi aprovada - Frota360.pt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #48BB78;">Parabéns!</h1>
          <p>Olá ${driverName},</p>
          <p>Sua conta na Frota360.pt foi aprovada! 🎉</p>
          <p>Agora você pode começar a usar nossa plataforma. Acesse o painel do motorista para:</p>
          <ul>
            <li>Configurar sua disponibilidade</li>
            <li>Escolher um plano de assinatura</li>
            <li>Começar a receber corridas</li>
          </ul>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL}/painel" 
               style="background-color: #48BB78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Acessar Painel
            </a>
          </div>
          <p>Bem-vindo à equipe Frota360.pt!</p>
          <p>Equipe Frota360.pt</p>
        </div>
      `,
      text: `Parabéns!\n\nOlá ${driverName},\n\nSua conta na Frota360.pt foi aprovada! 🎉\n\nAgora você pode começar a usar nossa plataforma. Acesse o painel do motorista para:\n\n- Configurar sua disponibilidade\n- Escolher um plano de assinatura\n- Começar a receber corridas\n\nAcesse: ${process.env.NEXTAUTH_URL}/painel\n\nBem-vindo à equipe Frota360.pt!\n\nEquipe Frota360.pt`,
    };
  }

  private getDriverRejectionTemplate(driverName: string, reason?: string): EmailTemplate {
    return {
      subject: 'Atualização sobre sua conta - Frota360.pt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #E53E3E;">Conta não aprovada</h1>
          <p>Olá ${driverName},</p>
          <p>Infelizmente, sua conta na Frota360.pt não foi aprovada no momento.</p>
          ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
          <p>Você pode entrar em contato conosco para mais informações ou tentar novamente no futuro.</p>
          <div style="margin: 20px 0;">
            <a href="mailto:suporte@conduz.pt" 
               style="background-color: #3182CE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Contatar Suporte
            </a>
          </div>
          <p>Obrigado pelo seu interesse na Frota360.pt.</p>
          <p>Equipe Frota360.pt</p>
        </div>
      `,
      text: `Conta não aprovada\n\nOlá ${driverName},\n\nInfelizmente, sua conta na Frota360.pt não foi aprovada no momento.\n\n${reason ? `Motivo: ${reason}\n\n` : ''}Você pode entrar em contato conosco para mais informações ou tentar novamente no futuro.\n\nContato: suporte@conduz.pt\n\nObrigado pelo seu interesse na Frota360.pt.\n\nEquipe Frota360.pt`,
    };
  }

  private getPaymentFailedTemplate(driverName: string, invoiceUrl?: string): EmailTemplate {
    return {
      subject: 'Falha no pagamento - Frota360.pt',
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
          <p>Equipe Frota360.pt</p>
        </div>
      `,
      text: `Falha no pagamento\n\nOlá ${driverName},\n\nHouve um problema com o pagamento da sua assinatura.\n\nPor favor, atualize suas informações de pagamento para evitar a suspensão do serviço.\n\n${invoiceUrl ? `Atualizar: ${invoiceUrl}\n\n` : ''}Se você tiver dúvidas, entre em contato conosco.\n\nEquipe Frota360.pt`,
    };
  }

  private getSubscriptionRenewalTemplate(driverName: string, planName: string, renewalDate: Date): EmailTemplate {
    const renewalDateStr = renewalDate.toLocaleDateString('pt-BR');
    
    return {
      subject: 'Renovação da assinatura em breve - Frota360.pt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #D69E2E;">Renovação em breve</h1>
          <p>Olá ${driverName},</p>
          <p>Sua assinatura do plano <strong>${planName}</strong> será renovada automaticamente em ${renewalDateStr}.</p>
          <p>Certifique-se de que seu método de pagamento está atualizado.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL}/painel/subscription" 
               style="background-color: #3182CE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Gerenciar Assinatura
            </a>
          </div>
          <p>Se você não deseja renovar, pode cancelar a qualquer momento.</p>
          <p>Equipe Frota360.pt</p>
        </div>
      `,
      text: `Renovação em breve\n\nOlá ${driverName},\n\nSua assinatura do plano ${planName} será renovada automaticamente em ${renewalDateStr}.\n\nCertifique-se de que seu método de pagamento está atualizado.\n\nGerenciar: ${process.env.NEXTAUTH_URL}/painel/subscription\n\nSe você não deseja renovar, pode cancelar a qualquer momento.\n\nEquipe Frota360.pt`,
    };
  }

  private getDriverCredentialsTemplate(driverName: string, email: string, temporaryPassword: string): EmailTemplate {
    return {
      subject: 'Bem-vindo à Frota360 - Suas Credenciais de Acesso',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fafc;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #48BB78; margin: 0;">🚗 Frota360</h1>
              <p style="color: #718096; margin: 5px 0;">Frota360 PT</p>
            </div>
            
            <h2 style="color: #2D3748; margin-bottom: 20px;">Olá ${driverName}!</h2>
            
            <p style="color: #4A5568; line-height: 1.6;">
              Sua conta foi criada com sucesso na plataforma Frota360! 🎉
            </p>
            
            <div style="background-color: #F7FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48BB78;">
              <h3 style="color: #2D3748; margin-top: 0;">Dados de Acesso:</h3>
              <p style="margin: 10px 0;">
                <strong style="color: #2D3748;">Email:</strong><br/>
                <code style="background-color: #EDF2F7; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; font-size: 14px;">${email}</code>
              </p>
              <p style="margin: 10px 0;">
                <strong style="color: #2D3748;">Senha Temporária:</strong><br/>
                <code style="background-color: #FED7D7; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; font-size: 14px; color: #C53030;">${temporaryPassword}</code>
              </p>
            </div>
            
            <div style="background-color: #FFF5F5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F56565;">
              <p style="margin: 0; color: #742A2A; font-size: 14px;">
                <strong>⚠️ Importante:</strong> Esta é uma senha temporária. Por segurança, recomendamos que você altere sua senha após o primeiro login.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'https://conduz.pt'}/painel" 
                 style="background-color: #48BB78; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Acessar Painel do Motorista
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
              <p style="color: #718096; font-size: 14px; margin: 5px 0;">
                <strong>Em caso de dúvidas:</strong>
              </p>
              <p style="color: #718096; font-size: 14px; margin: 5px 0;">
                📧 Email: suporte@conduz.pt<br/>
                📱 WhatsApp: +351 912 345 678
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
              <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                Bem-vindo à equipe Frota360!<br/>
                Frota360 PT - Gestão de Motoristas TVDE
              </p>
            </div>
          </div>
        </div>
      `,
  text: `Bem-vindo à Frota360!\n\nOlá ${driverName}!\n\nSua conta foi criada com sucesso na plataforma Frota360! 🎉\n\nDADOS DE ACESSO:\n\nEmail: ${email}\nSenha Temporária: ${temporaryPassword}\n\n⚠️ IMPORTANTE: Esta é uma senha temporária. Por segurança, recomendamos que você altere sua senha após o primeiro login.\n\nAcesse o painel: ${process.env.NEXTAUTH_URL || 'https://conduz.pt'}/painel\n\nEM CASO DE DÚVIDAS:\nEmail: suporte@conduz.pt\nWhatsApp: +351 912 345 678\n\nBem-vindo à equipe Frota360!\nFrota360 PT - Gestão de Motoristas TVDE`,
    };
  }

  private getPasswordResetTemplate(driverName: string, resetToken: string): EmailTemplate {
    const resetUrl = `${process.env.NEXTAUTH_URL || 'https://conduz.pt'}/reset-password?token=${resetToken}`;
    
    return {
      subject: 'Recuperação de Senha - Frota360',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fafc;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #48BB78; margin: 0;">🔐 Recuperação de Senha</h1>
            </div>
            
            <h2 style="color: #2D3748; margin-bottom: 20px;">Olá ${driverName}!</h2>
            
            <p style="color: #4A5568; line-height: 1.6;">
              Recebemos uma solicitação para redefinir a senha da sua conta na plataforma Frota360.
            </p>
            
            <p style="color: #4A5568; line-height: 1.6;">
              Se você não fez esta solicitação, ignore este email. Sua senha permanecerá inalterada.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #48BB78; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Redefinir Senha
              </a>
            </div>
            
            <div style="background-color: #FFF5F5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F56565;">
              <p style="margin: 0; color: #742A2A; font-size: 14px;">
                <strong>⚠️ Atenção:</strong> Este link expira em 1 hora por questões de segurança.
              </p>
            </div>
            
            <p style="color: #718096; font-size: 14px; margin-top: 20px;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br/>
              <code style="background-color: #EDF2F7; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; font-size: 12px; word-break: break-all;">${resetUrl}</code>
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
              <p style="color: #718096; font-size: 14px; margin: 5px 0;">
                <strong>Precisa de ajuda?</strong>
              </p>
              <p style="color: #718096; font-size: 14px; margin: 5px 0;">
                📧 Email: suporte@conduz.pt<br/>
                📱 WhatsApp: +351 912 345 678
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
              <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                Frota360 PT<br/>
                Gestão de Motoristas TVDE
              </p>
            </div>
          </div>
        </div>
      `,
  text: `Recuperação de Senha - Frota360\n\nOlá ${driverName}!\n\nRecebemos uma solicitação para redefinir a senha da sua conta na plataforma Frota360.\n\nSe você não fez esta solicitação, ignore este email. Sua senha permanecerá inalterada.\n\nPara redefinir sua senha, acesse:\n${resetUrl}\n\n⚠️ ATENÇÃO: Este link expira em 1 hora por questões de segurança.\n\nPRECISA DE AJUDA?\nEmail: suporte@conduz.pt\nWhatsApp: +351 912 345 678\n\nFrota360 PT\nGestão de Motoristas TVDE`,
    };
  }

  private getPasswordChangedTemplate(driverName: string, newPassword: string): EmailTemplate {
    return {
      subject: 'Sua senha foi atualizada - Frota360',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fafc;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #48BB78; margin: 0;">🔐 Senha atualizada</h1>
            <p style="color: #4A5568; line-height: 1.6;">Olá ${driverName},</p>
            <p style="color: #4A5568; line-height: 1.6;">Sua senha foi alterada com sucesso por um administrador.</p>
            <div style="background-color: #F7FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48BB78;">
              <p style="margin: 0;">
                <strong style="color: #2D3748;">Nova Senha:</strong><br/>
                <code style="background-color: #EDF2F7; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; font-size: 14px;">${newPassword}</code>
              </p>
            </div>
            <div style="background-color: #FFF5F5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F56565;">
              <p style="margin: 0; color: #742A2A; font-size: 14px;">
                <strong>Importante:</strong> Por segurança, recomendamos que você altere esta senha após o primeiro login.
              </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'https://conduz.pt'}/painel" 
                 style="background-color: #48BB78; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Acessar Painel do Motorista
              </a>
            </div>
            <p style="color: #718096; font-size: 12px;">Se você não solicitou esta alteração, entre em contato com o suporte imediatamente.</p>
            <p style="color: #718096; font-size: 12px;">Frota360 PT - Gestão de Motoristas TVDE</p>
          </div>
        </div>
      `,
      text: `Senha atualizada\n\nOlá ${driverName},\n\nSua senha foi alterada com sucesso por um administrador.\n\nNova senha: ${newPassword}\n\nImportante: Por segurança, recomendamos que você altere esta senha após o primeiro login.\n\nAcesse o painel: ${(process.env.NEXTAUTH_URL || 'https://conduz.pt') + '/painel'}\n\nSe você não solicitou esta alteração, contate o suporte imediatamente.\n\nFrota360 PT - Gestão de Motoristas TVDE`,
    };
  }
}

export const emailService = new EmailService();
