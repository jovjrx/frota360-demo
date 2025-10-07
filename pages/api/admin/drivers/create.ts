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
      fullName,
      email,
      phone,
      type, // 'affiliate' ou 'renter'
      status, // 'active' ou 'inactive'

      // Campos adicionais
      firstName,
      lastName,
      birthDate,
      city,
      iban,
      accountHolder,
      vehiclePlate,
      vehicleModel,
      rentalFee,
      uberUuid,
      boltEmail,
      myprioCard,
      viaverdeEnabled,
    } = req.body;

    // Validações básicas
    if (!fullName || !email || !phone || !type || !status) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: fullName, email, phone, type, status' 
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

    // Verificar se email já existe no Firestore
    const existingDrivers = await adminDb
      .collection('drivers')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingDrivers.empty) {
      return res.status(400).json({ 
        error: 'Email já cadastrado como motorista' 
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
        displayName: fullName,
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

    const driverData: any = {
      // Dados pessoais
      firstName: firstName || fullName.split(' ')[0] || '',
      lastName: lastName || fullName.split(' ').slice(1).join(' ') || '',
      fullName,
      email,
      phone,
      birthDate: birthDate || null,
      city: city || '',
      
      // Status
      status,
      type,
      
      // Dados bancários
      banking: {
        iban: iban || null,
        accountHolder: accountHolder || fullName,
      },
      
      // Integrações (estrutura unificada)
      integrations: {
        uber: {
          key: uberUuid || null,
          enabled: !!uberUuid,
          lastSync: null,
        },
        bolt: {
          key: boltEmail || email, // Usar email como padrão se não informado
          enabled: !!boltEmail,
          lastSync: null,
        },
        myprio: {
          key: myprioCard || null,
          enabled: !!myprioCard,
          lastSync: null,
        },
        viaverde: {
          key: vehiclePlate || null, // Usar placa do veículo como key para ViaVerde
          enabled: viaverdeEnabled || !!vehiclePlate,
          lastSync: null,
        },
      },
      
      // Dados do Firebase Auth
      firebaseUid,
      
      // Timestamps
      createdAt: now,
      createdBy: session.userId,
      updatedAt: now,
      activatedAt: status === 'active' ? now : null,
      activatedBy: status === 'active' ? session.userId : null,
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
        fullName,
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

