import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { name, email, interest, phone, message } = req.body;

    // Validação dos campos obrigatórios
    if (!name || !email || !interest || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Validação do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Gmail-only transport with fallbacks
    const gmailUser = process.env.EMAIL_USER || "conduzcontacto@gmail.com";
    const gmailAppPassword = process.env.EMAIL_PASSWORD || "mogu muee ptnp ebbs"; // Fallback para produção
  const fromEmail = process.env.EMAIL_FROM || "contacto@conduz.pt";
    
    console.log('📧 Usando configuração de email:', { user: gmailUser, hasPassword: !!gmailAppPassword });

    console.log("Using Gmail transport with user:", gmailUser);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      }
    });

    // Verificar conexão SMTP antes de enviar
    try {
      await transporter.verify();
    } catch (err) {
      console.error('❌ SMTP verification failed:', err);
      return res.status(502).json({
        success: false,
        message: 'SMTP connection failed',
        error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined,
      });
    }

  // Email para a equipe Frota360 PT
    const senderAddress = fromEmail || gmailUser;
    const companyEmail = {
      from: senderAddress,
      sender: gmailUser,
  to: process.env.COMPANY_EMAIL || 'suporte@conduz.pt',
      subject: `🆕 Frota360.pt - Novo Contacto: ${interest} - ${name}`,
      replyTo: email,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #248C3B 0%, #A31624 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <img src="https://conduz.pt/img/logo.png" alt="Frota360.pt" style="max-width: 140px; height: auto; margin-bottom: 10px;" />
            <h1 style="margin: 0; font-size: 24px;">🆕 Novo Contacto Recebido - Frota360</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">📋 Informações do Cliente</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">Nome:</td>
                  <td style="padding: 8px 0; color: #333;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Interesse:</td>
                  <td style="padding: 8px 0; color: #333;">${interest || 'Não informado'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Telefone:</td>
                  <td style="padding: 8px 0; color: #333;">${phone || 'Não informado'}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="color: #333; margin-top: 0;">💬 Mensagem</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #248C3B;">
                <p style="margin: 0; line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">
                📧 Este email foi enviado automaticamente pelo formulário de contacto do website
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Email de confirmação para o cliente
    const clientEmail = {
      from: senderAddress,
      sender: gmailUser,
      to: email,
      subject: '✅ Contacto Recebido - Frota360.pt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #248C3B 0%, #A31624 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <img src="https://conduz.pt/img/logo.png" alt="Frota360.pt" style="max-width: 140px; height: auto; margin-bottom: 10px;" />
            <h1 style="margin: 0; font-size: 24px;">✅ Obrigado pelo seu contacto!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá <strong>${name}</strong>,
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Recebemos sua mensagem e queremos agradecer o seu interesse na Frota360.pt. 
                Nossa equipa especializada analisará suas necessidades e entrará em contacto consigo 
                no prazo de <strong>24 horas</strong>.
              </p>
              
              <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #248C3B;">
                <h3 style="color: #333; margin-top: 0; font-size: 18px;">📋 Resumo do seu pedido:</h3>
                <ul style="color: #333; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li><strong>Serviço:</strong> ${interest}</li>
                  <li><strong>Mensagem:</strong> ${message.length > 100 ? message.substring(0, 100) + '...' : message}</li>
                </ul>
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0; font-size: 18px;">🚀 O que acontece agora?</h3>
              <ol style="color: #333; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Nossa equipa analisa suas necessidades</li>
                <li>Preparamos uma proposta personalizada</li>
                <li>Entramos em contacto em até 24 horas</li>
                <li>Marcamos uma reunião para detalhes</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">
                Atenciosamente,<br>
                <strong>Equipa Frota360.pt</strong><br>
                📧 suporte@conduz.pt<br>
                🌐 conduz.pt
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Enviar emails
    console.log('📧 Enviando emails via Nodemailer...');
    
    const [companyResult, clientResult] = await Promise.all([
      transporter.sendMail(companyEmail),
      transporter.sendMail(clientEmail)
    ]);

    console.log('✅ Emails enviados com sucesso:', {
      company: companyResult.messageId,
      client: clientResult.messageId
    });

    res.status(200).json({ 
      success: true, 
      message: 'Emails sent successfully',
      data: {
        companyEmail: companyResult.messageId,
        clientEmail: clientResult.messageId
      }
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
}
