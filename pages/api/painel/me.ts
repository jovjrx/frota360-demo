import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from 'next-auth/react';

/**
 * GET /api/painel/me
 * Retorna os dados do motorista logado
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getSession({ req });
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const userEmail = session.user.email;

    // Buscar motorista pelo email
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (driversSnapshot.empty) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }

    const driverDoc = driversSnapshot.docs[0];
    const driverData = driverDoc.data();

    // Verificar se está ativo
    if (driverData.status !== 'active') {
      return res.status(403).json({ 
        error: 'Conta não ativa',
        status: driverData.status 
      });
    }

    // Retornar apenas dados que o motorista pode ver
    const motorista = {
      id: driverDoc.id,
      
      // Dados pessoais
      firstName: driverData.firstName || '',
      lastName: driverData.lastName || '',
      fullName: driverData.fullName || `${driverData.firstName} ${driverData.lastName}`,
      email: driverData.email || '',
      phone: driverData.phone || '',
      birthDate: driverData.birthDate || null,
      city: driverData.city || '',
      
      // Status
      status: driverData.status || 'pending',
      type: driverData.type || 'affiliate',
      
      // Dados bancários (IBAN mascarado)
      banking: {
        iban: driverData.banking?.iban 
          ? maskIban(driverData.banking.iban) 
          : null,
        accountHolder: driverData.banking?.accountHolder || null,
      },
      
      // Veículo (se locatário)
      vehicle: driverData.type === 'renter' ? {
        plate: driverData.vehicle?.plate || null,
        model: driverData.vehicle?.model || null,
        assignedDate: driverData.vehicle?.assignedDate || null,
      } : null,
      
      // Aluguel (se locatário)
      rentalFee: driverData.type === 'renter' ? (driverData.rentalFee || 0) : 0,
      
      // Datas
      createdAt: driverData.createdAt || null,
      activatedAt: driverData.activatedAt || null,
    };

    return res.status(200).json(motorista);

  } catch (error) {
    console.error('Erro ao buscar dados do motorista:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Mascara o IBAN mostrando apenas os primeiros 4 e últimos 2 dígitos
 * Exemplo: PT50003300004555698867005 → PT50 **** **** **** **05
 */
function maskIban(iban: string): string {
  if (!iban || iban.length < 6) return iban;
  
  const first4 = iban.substring(0, 4);
  const last2 = iban.substring(iban.length - 2);
  const middle = '*'.repeat(Math.max(0, iban.length - 6));
  
  // Formatar com espaços a cada 4 caracteres
  const masked = first4 + middle + last2;
  return masked.match(/.{1,4}/g)?.join(' ') || masked;
}
