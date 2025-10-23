import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute, sessionOptions, SessionRequest } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { generateTemporaryPassword } from '@/lib/utils/password';

/**
 * API para criar motorista diretamente (sem passar por solicitação)
 * POST /api/admin/drivers/create
 */
export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = getFirestore(firebaseAdmin);
    const adminAuth = getAuth(firebaseAdmin);

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
        success: false,
        error: 'Campos obrigatórios: fullName, email, phone, type, status' 
      });
    }

    if (type !== 'affiliate' && type !== 'renter') {
      return res.status(400).json({ 
        success: false,
        error: 'Tipo inválido. Use "affiliate" ou "renter"' 
      });
    }

    // Se for locatário, veículo é obrigatório
    if (type === 'renter' && (!vehiclePlate || !vehicleModel)) {
      return res.status(400).json({ 
        success: false,
        error: 'Locatários precisam ter veículo (vehiclePlate e vehicleModel)' 
      });
    }

    // Verificar se email já existe no Firestore
    const existingDrivers = await db
      .collection('drivers')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingDrivers.empty) {
      return res.status(400).json({ 
        success: false,
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

    } catch (authError: any) {
      console.error('Erro ao criar conta Firebase Auth:', authError);
      
      if (authError.code === 'auth/email-already-exists') {
        return res.status(400).json({ 
          success: false,
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
      createdBy: user.id,
      updatedAt: now,
      activatedAt: status === 'active' ? now : null,
      activatedBy: status === 'active' ? user.id : null,
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
    // Garantir taxa administrativa padrão: €25 fixo
    const driverRef = await db.collection('drivers').add({
      ...driverData,
      adminFee: driverData.adminFee || {
        mode: 'fixed',
        fixedValue: 25,
      },
    });
    const driverId = driverRef.id;

    // Atualizar custom claim com driverId
    await adminAuth.setCustomUserClaims(firebaseUid, {
      role: 'driver',
      driverId: driverId,
    });

    // 3. Criar notificação de boas-vindas
    await db
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
      success: false,
      error: 'Erro ao criar motorista',
      details: error.message 
    });
  }
}, sessionOptions);
