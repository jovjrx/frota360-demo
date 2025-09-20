import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'email é obrigatório' });
    }

    // Lista de emails admin permitidos
    const adminEmails = [
      'conduzcontacto@gmail.com',
      'admin@conduz.pt'
    ];
    
    // Verifica se termina com @conduz.pt ou está na lista de admins
    const isConduzPt = email.endsWith('@conduz.pt');
    const isInAdminList = adminEmails.includes(email.toLowerCase());
    
    const isAdmin = isConduzPt || isInAdminList;
    
    return res.status(200).json({ isAdmin });

  } catch (error) {
    console.error('Erro ao verificar email admin:', error);
    return res.status(500).json({ 
      isAdmin: false,
      error: 'Erro interno do servidor' 
    });
  }
}
