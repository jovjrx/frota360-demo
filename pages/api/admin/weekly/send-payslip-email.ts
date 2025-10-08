import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { recordId, driverEmail, driverName, weekStart, weekEnd, pdfBase64 } = req.body;

    if (!recordId || !driverEmail || !driverName || !weekStart || !weekEnd || !pdfBase64) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get email configuration from Firebase (or environment variables)
    const emailConfigDoc = await adminDb.collection('settings').doc('email').get();
    const emailConfig = emailConfigDoc.data();

    if (!emailConfig || !emailConfig.host || !emailConfig.port || !emailConfig.secure || !emailConfig.auth.user || !emailConfig.auth.pass) {
      return res.status(500).json({ message: 'Email configuration missing or incomplete' });
    }

    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });

    const mailOptions = {
      from: emailConfig.auth.user,
      to: driverEmail,
      subject: `Seu Contracheque Semanal - ${weekStart} a ${weekEnd}`,
      html: `
        <p>Olá ${driverName},</p>
        <p>Seu contracheque referente à semana de ${weekStart} a ${weekEnd} está anexado a este e-mail.</p>
        <p>Atenciosamente,</p>
        <p>A equipe Conduz.pt</p>
      `,
      attachments: [
        {
          filename: `contracheque_${driverName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_${weekStart}_a_${weekEnd}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email sent successfully' });

  } catch (error: any) {
    console.error('Error sending payslip email:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
