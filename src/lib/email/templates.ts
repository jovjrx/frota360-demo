export interface ApprovalEmailData {
  driverName: string;
  email: string;
  password: string;
  loginUrl: string;
}

export interface RejectionEmailData {
  driverName: string;
  reason: string;
}

export function getApprovalEmailTemplate(data: ApprovalEmailData): { subject: string; html: string; text: string } {
  const subject = 'Bem-vindo à Conduz.pt! 🎉';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .credentials {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .credentials strong {
      color: #667eea;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Bem-vindo à Conduz.pt!</h1>
  </div>
  <div class="content">
    <p>Olá <strong>${data.driverName}</strong>,</p>
    
    <p>Temos o prazer de informar que sua solicitação foi <strong>aprovada</strong>!</p>
    
    <p>Você agora faz parte da equipe Conduz.pt. Abaixo estão suas credenciais de acesso ao painel do motorista:</p>
    
    <div class="credentials">
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Senha:</strong> ${data.password}</p>
    </div>
    
    <p><strong>⚠️ Importante:</strong> Por favor, altere sua senha após o primeiro acesso.</p>
    
    <center>
      <a href="${data.loginUrl}" class="button">Acessar Painel do Motorista</a>
    </center>
    
    <p>Se tiver qualquer dúvida, entre em contato conosco.</p>
    
    <p>Bem-vindo à equipe! 🚗</p>
    
    <p>Atenciosamente,<br><strong>Equipe Conduz.pt</strong></p>
  </div>
  <div class="footer">
    <p>Este é um email automático. Por favor, não responda.</p>
  </div>
</body>
</html>
  `;
  
  const text = `
Bem-vindo à Conduz.pt! 🎉

Olá ${data.driverName},

Temos o prazer de informar que sua solicitação foi aprovada!

Você agora faz parte da equipe Conduz.pt. Abaixo estão suas credenciais de acesso:

Email: ${data.email}
Senha: ${data.password}

⚠️ Importante: Por favor, altere sua senha após o primeiro acesso.

Acesse o painel: ${data.loginUrl}

Se tiver qualquer dúvida, entre em contato conosco.

Bem-vindo à equipe! 🚗

Atenciosamente,
Equipe Conduz.pt
  `;
  
  return { subject, html, text };
}

export function getRejectionEmailTemplate(data: RejectionEmailData): { subject: string; html: string; text: string } {
  const subject = 'Atualização sobre sua solicitação - Conduz.pt';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #f56565;
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .reason {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #f56565;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Atualização sobre sua solicitação</h1>
  </div>
  <div class="content">
    <p>Olá <strong>${data.driverName}</strong>,</p>
    
    <p>Agradecemos seu interesse em fazer parte da equipe Conduz.pt.</p>
    
    <p>Infelizmente, não podemos aprovar sua solicitação neste momento.</p>
    
    <div class="reason">
      <p><strong>Motivo:</strong></p>
      <p>${data.reason}</p>
    </div>
    
    <p>Se tiver dúvidas ou quiser mais informações, não hesite em entrar em contato conosco.</p>
    
    <p>Agradecemos sua compreensão.</p>
    
    <p>Atenciosamente,<br><strong>Equipe Conduz.pt</strong></p>
  </div>
  <div class="footer">
    <p>Este é um email automático. Por favor, não responda.</p>
  </div>
</body>
</html>
  `;
  
  const text = `
Atualização sobre sua solicitação - Conduz.pt

Olá ${data.driverName},

Agradecemos seu interesse em fazer parte da equipe Conduz.pt.

Infelizmente, não podemos aprovar sua solicitação neste momento.

Motivo: ${data.reason}

Se tiver dúvidas ou quiser mais informações, não hesite em entrar em contato conosco.

Agradecemos sua compreensão.

Atenciosamente,
Equipe Conduz.pt
  `;
  
  return { subject, html, text };
}

