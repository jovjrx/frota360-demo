import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

/**
 * Gera uma senha temporária aleatória
 */
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * API para criar motorista diretamente (sem passar por solicitação)
 * POST /api/admin/drivers/create
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação de admin
    const session = await getSession(req, res);
    if (!session.userId || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      // Dados pessoais obrigatórios
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      city,
      
      // Tipo de motorista
      type, // 'affiliate' ou 'renter'
      
      // Dados bancários
      iban,
      accountHolder,
      
      // Dados do veículo (se locatário)
      vehiclePlate,
      vehicleModel,
      rentalFee,
      
      // Integrações (opcional)
      uberUuid,
      boltDriverId,
      myprioEnabled,
      viaverdeEnabled,
    } = req.body;

    // Validações básicas
    if (!firstName || !lastName || !email || !phone || !type) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: firstName, lastName, email, phone, type' 
      });
    }

    if (type !== 'affiliate' && type !== 'renter') {
      return res.status(400).json({ 
        error: 'Tipo inválido. Use "affiliate" ou "renter"' 
      });
    }

    // Se for locatário, veículo é obrigatório
    if (type === 'renter' && (!vehiclePlate || !vehicleModel)) {
      return res.status(400).json({ 
        error: 'Locatários precisam ter veículo (vehiclePlate e vehicleModel)' 
      });
    }

    // Verificar se email já existe
    const existingDrivers = await adminDb
      .collection('drivers')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingDrivers.empty) {
      return res.status(400).json({ 
        error: 'Email já cadastrado' 
      });
    }

    // 1. Criar conta no Firebase Auth
    const temporaryPassword = generateTemporaryPassword();
    
    let firebaseUid: string;
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password: temporaryPassword,
        emailVerified: false,
        displayName: `${firstName} ${lastName}`,
      });

      firebaseUid = userRecord.uid;

      // Definir custom claim para role de motorista
      await adminAuth.setCustomUserClaims(userRecord.uid, {
        role: 'driver',
      });

      console.log(`✅ Conta Firebase Auth criada para ${email} (UID: ${firebaseUid})`);

    } catch (authError: any) {
      console.error('Erro ao criar conta Firebase Auth:', authError);
      
      if (authError.code === 'auth/email-already-exists') {
        return res.status(400).json({ 
          error: 'Email já existe no Firebase Auth' 
        });
      }
      
      throw authError;
    }

    // 2. Criar documento do motorista no Firestore
    const now = new Date().toISOString();
    const fullName = `${firstName} ${lastName}`;

    const driverData: any = {
      // Dados pessoais
      firstName,
      lastName,
      fullName,
      email,
      phone,
      birthDate: birthDate || null,
      city: city || '',
      
      // Status
      status: 'active', // Já ativo direto
      type,
      
      // Dados bancários
      banking: {
        iban: iban || null,
        accountHolder: accountHolder || fullName,
      },
      
      // Integrações
      integrations: {
        uber: {
          uuid: uberUuid || null,
          name: null,
          enabled: !!uberUuid,
        },
        bolt: {
          id: boltDriverId || null,
          email: null,
          enabled: !!boltDriverId,
        },
      },
      
      // Cartões de combustível/portagens
      cards: {
        myprio: myprioEnabled ? 'enabled' : null,
        viaverde: viaverdeEnabled ? 'enabled' : null,
      },
      
      // Dados do Firebase Auth
      firebaseUid,
      
      // Timestamps
      createdAt: now,
      createdBy: session.userId,
      updatedAt: now,
      activatedAt: now,
      activatedBy: session.userId,
    };

    // Adicionar dados específicos de locatário
    if (type === 'renter') {
      driverData.vehicle = {
        plate: vehiclePlate,
        model: vehicleModel,
        assignedDate: now,
      };
      driverData.rentalFee = rentalFee || 0;
    } else {
      driverData.vehicle = null;
      driverData.rentalFee = 0;
    }

    // Criar documento no Firestore
    const driverRef = await adminDb.collection('drivers').add(driverData);
    const driverId = driverRef.id;

    // Atualizar custom claim com driverId
    await adminAuth.setCustomUserClaims(firebaseUid, {
      role: 'driver',
      driverId: driverId,
    });

    // 3. Criar notificação de boas-vindas
    await adminDb
      .collection('drivers')
      .doc(driverId)
      .collection('notifications')
      .add({
        type: 'welcome',
        title: 'Bem-vindo à Conduz!',
        message: 'Sua conta foi criada com sucesso. Você já pode fazer login no painel.',
        read: false,
        createdAt: now,
        createdBy: 'system',
      });

    // 4. Enviar email com credenciais
    try {
      const { emailService } = await import('@/lib/email/mailer');
      await emailService.sendDriverCredentialsEmail(
        email,
        `${firstName} ${lastName}`,
        temporaryPassword
      );
      console.log(`✅ Email com credenciais enviado para ${email}`);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      // Não falhar a operação se o email falhar
    }

    return res.status(201).json({ 
      success: true,
      message: 'Motorista criado com sucesso',
      driverId,
      firebaseUid,
      email,
      temporaryPassword, // Retornar para o admin copiar
      loginUrl: '/painel',
    });

  } catch (error: any) {
    console.error('Erro ao criar motorista:', error);
    return res.status(500).json({ 
      error: 'Erro ao criar motorista',
      details: error.message 
    });
  }
}
