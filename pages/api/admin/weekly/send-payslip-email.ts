import { NextApiRequest, NextApiResponse } from 'next';
import { emailService } from '@/lib/email/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { recordId, driverEmail, driverName, weekStart, weekEnd, pdfBase64 } = req.body;

    if (!recordId || !driverEmail || !driverName || !weekStart || !weekEnd || !pdfBase64) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await emailService.sendEmail({
      to: driverEmail,
      subject: `Seu Contracheque Semanal - ${weekStart} a ${weekEnd}`,
      html: `
        <p>Olá ${driverName},</p>
        <p>Seu contracheque referente à semana de ${weekStart} a ${weekEnd} está anexado a este e-mail.</p>
        <p>Atenciosamente,</p>
        <p>A equipe Frota360.pt</p>
      `,
      text: `Olá ${driverName},\n\nSeu contracheque referente à semana de ${weekStart} a ${weekEnd} está em anexo.\n\nAtenciosamente,\nEquipe Frota360.pt`,
      attachments: [
        {
          filename: `contracheque_${driverName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_${weekStart}_a_${weekEnd}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    });

    res.status(200).json({ message: 'Email sent successfully' });

  } catch (error: any) {
    console.error('Error sending payslip email:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
