import nodemailer, { type Transporter, type SendMailOptions } from 'nodemailer';

type TransporterProvider = 'gmail' | 'smtp' | null;

export interface TransporterConfig {
  transporter: Transporter | null;
  defaultFrom?: string;
  provider: TransporterProvider;
}

function resolveGmailCredentials() {
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD;
  if (user && pass) {
    return { user, pass };
  }
  return null;
}

export function buildEmailTransporter(): TransporterConfig {
  const gmailCreds = resolveGmailCredentials();
  if (gmailCreds) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailCreds.user,
        pass: gmailCreds.pass,
      },
    });

    return {
      transporter,
      defaultFrom: process.env.EMAIL_FROM || gmailCreds.user,
      provider: 'gmail',
    };
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    return {
      transporter,
      defaultFrom: process.env.EMAIL_FROM || user,
      provider: 'smtp',
    };
  }

  return {
    transporter: null,
    defaultFrom: process.env.EMAIL_FROM,
    provider: null,
  };
}

export type EmailAttachments = SendMailOptions['attachments'];
