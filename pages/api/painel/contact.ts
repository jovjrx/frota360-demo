import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session/ironSession';
import { sendEmail } from '@/lib/email/sendEmail';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar sessão
    const session: any = await getIronSession(req, res, sessionOptions);
    
    if (!session.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios' });
    }

    // Buscar dados do motorista
    const driverId = session.userId;
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', driverId)
      .limit(1)
      .get();

    if (driversSnapshot.empty) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }

    const driverData = driversSnapshot.docs[0].data();
    const driverName = driverData.fullName || `${driverData.firstName} ${driverData.lastName}`;
    const driverEmail = driverData.email;
    const driverPhone = driverData.phone || 'Não informado';

    // Enviar email para o suporte
    const emailContent = `
      <h2>Nova Mensagem de Contato do Painel do Motorista</h2>
      
      <h3>Dados do Motorista:</h3>
      <p><strong>Nome:</strong> ${driverName}</p>
      <p><strong>Email:</strong> ${driverEmail}</p>
      <p><strong>Telefone:</strong> ${driverPhone}</p>
      <p><strong>Tipo:</strong> ${driverData.type === 'renter' ? 'Locatário' : 'Afiliado'}</p>
      
      <h3>Assunto:</h3>
      <p>${subject}</p>
      
      <h3>Mensagem:</h3>
      <p style="white-space: pre-wrap;">${message}</p>
      
      <hr>
      <p style="color: #666; font-size: 12px;">
        Esta mensagem foi enviada através do painel do motorista em ${new Date().toLocaleString('pt-PT')}.
      </p>
    `;

    await sendEmail({
      to: 'conduz@alvoradamagistral.eu',
      subject: `[Painel Motorista] ${subject}`,
      html: emailContent,
      text: `Nova mensagem de ${driverName} (${driverEmail})\n\nAssunto: ${subject}\n\nMensagem:\n${message}`,
    });

    // Email de confirmação para o motorista
    const confirmationEmail = `
      <h2>Recebemos sua mensagem!</h2>
      
      <p>Olá ${driverName},</p>
      
      <p>Recebemos sua mensagem através do painel e nossa equipe entrará em contato em breve.</p>
      
      <h3>Resumo da sua mensagem:</h3>
      <p><strong>Assunto:</strong> ${subject}</p>
      <p><strong>Mensagem:</strong></p>
      <p style="white-space: pre-wrap; background: #f5f5f5; padding: 10px; border-radius: 5px;">${message}</p>
      
      <p>Caso seja urgente, você também pode entrar em contato através:</p>
      <ul>
        <li>WhatsApp: +351 91 234 5678</li>
        <li>Email: conduz@alvoradamagistral.eu</li>
      </ul>
      
      <p>Atenciosamente,<br><strong>Equipe CONDUZ.PT</strong></p>
    `;

    await sendEmail({
      to: driverEmail,
      subject: 'Mensagem Recebida - CONDUZ.PT',
      html: confirmationEmail,
      text: `Olá ${driverName},\n\nRecebemos sua mensagem através do painel e nossa equipe entrará em contato em breve.\n\nResumo da sua mensagem:\nAssunto: ${subject}\nMensagem: ${message}\n\nAtenciosamente,\nEquipe CONDUZ.PT`,
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem de contato:', error);
    return res.status(500).json({ 
      error: 'Erro ao enviar mensagem',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
