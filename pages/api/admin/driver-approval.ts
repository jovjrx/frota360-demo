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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check admin authentication
    const session = await getSession(req, res);
    if (!session.userId || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { driverId, action, planId, rejectionReason } = req.body;

    if (!driverId || !action) {
      return res.status(400).json({ error: 'driverId and action are required' });
    }

    const driverRef = adminDb.collection('drivers').doc(driverId);
    const driverDoc = await driverRef.get();

    if (!driverDoc.exists) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driverData = driverDoc.data();

    if (action === 'approve') {
      // 1. Criar conta no Firebase Auth (se não existir)
      let firebaseUid = driverData?.firebaseUid;
      let temporaryPassword = '';

      if (!firebaseUid) {
        try {
          // Gerar senha temporária
          temporaryPassword = generateTemporaryPassword();

          // Criar usuário no Firebase Auth
          const userRecord = await adminAuth.createUser({
            email: driverData?.email,
            password: temporaryPassword,
            emailVerified: false,
            displayName: driverData?.fullName || `${driverData?.firstName} ${driverData?.lastName}`,
          });

          firebaseUid = userRecord.uid;

          // Definir custom claim para role de motorista
          await adminAuth.setCustomUserClaims(userRecord.uid, {
            role: 'driver',
            driverId: driverId,
          });

          console.log(`✅ Conta Firebase Auth criada para ${driverData?.email} (UID: ${firebaseUid})`);

        } catch (authError: any) {
          // Se o email já existe, tentar buscar o usuário
          if (authError.code === 'auth/email-already-exists') {
            try {
              const existingUser = await adminAuth.getUserByEmail(driverData?.email);
              firebaseUid = existingUser.uid;

              // Atualizar custom claims
              await adminAuth.setCustomUserClaims(existingUser.uid, {
                role: 'driver',
                driverId: driverId,
              });

              console.log(`⚠️ Email já existe, usando conta existente (UID: ${firebaseUid})`);
            } catch (error) {
              console.error('Erro ao buscar usuário existente:', error);
              throw new Error('Email já existe mas não foi possível vincular a conta');
            }
          } else {
            console.error('Erro ao criar conta Firebase Auth:', authError);
            throw authError;
          }
        }
      }

      // 2. Atualizar dados do motorista no Firestore
      const updateData: any = {
        status: 'active',
        approvedAt: new Date().toISOString(),
        approvedBy: session.userId,
        updatedAt: new Date().toISOString(),
        firebaseUid: firebaseUid,
        activatedAt: new Date().toISOString(),
        activatedBy: session.userId,
      };

      // If planId is provided, update the selected plan
      if (planId) {
        const planDoc = await adminDb.collection('plans').doc(planId).get();
        if (planDoc.exists) {
          const planData = planDoc.data();
          updateData.selectedPlan = planId;
          updateData.planName = planData?.name;
          updateData.planPrice = planData?.priceCents;
        }
      }

      await driverRef.update(updateData);

      // 3. Create subscription if driver has a selected plan
      if (driverData?.selectedPlan || planId) {
        const subscriptionData = {
          driverId,
          planId: planId || driverData.selectedPlan,
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          trialStart: new Date().toISOString(),
          trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days trial
          createdAt: new Date().toISOString(),
          createdBy: session.userId,
        };

        await adminDb.collection('subscriptions').add(subscriptionData);
      }

      // 4. Create notification for driver
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'driver_approved',
          title: 'Conta Aprovada!',
          message: 'Sua conta foi aprovada e você já pode começar a trabalhar.',
          read: false,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        });

      // 5. Enviar email com credenciais
      if (temporaryPassword) {
        try {
          const { emailService } = await import('@/lib/email/mailer');
          await emailService.sendDriverCredentialsEmail(
            driverData?.email,
            driverData?.fullName || `${driverData?.firstName} ${driverData?.lastName}`,
            temporaryPassword
          );
          console.log(`✅ Email com credenciais enviado para ${driverData?.email}`);
        } catch (emailError) {
          console.error('❌ Erro ao enviar email:', emailError);
          // Não falhar a operação se o email falhar
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Driver approved successfully',
        firebaseUid,
        email: driverData?.email,
        temporaryPassword: temporaryPassword || null, // Retornar apenas para o admin ver
      });

    } else if (action === 'reject') {
      // Reject driver
      await driverRef.update({
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: session.userId,
        rejectionReason: rejectionReason || 'Documentos não atendem aos requisitos',
        updatedAt: new Date().toISOString(),
      });

      // Create notification for driver
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'driver_rejected',
          title: 'Conta Rejeitada',
          message: rejectionReason || 'Sua conta foi rejeitada. Entre em contato com o suporte para mais informações.',
          read: false,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        });

      return res.status(200).json({ 
        success: true, 
        message: 'Driver rejected successfully' 
      });

    } else if (action === 'change_plan') {
      // Change driver's plan
      if (!planId) {
        return res.status(400).json({ error: 'planId is required for plan change' });
      }

      const planDoc = await adminDb.collection('plans').doc(planId).get();
      if (!planDoc.exists) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const planData = planDoc.data();

      await driverRef.update({
        selectedPlan: planId,
        planName: planData?.name,
        planPrice: planData?.priceCents,
        updatedAt: new Date().toISOString(),
        updatedBy: session.userId,
      });

      // Update or create subscription
      const subscriptionSnap = await adminDb
        .collection('subscriptions')
        .where('driverId', '==', driverId)
        .limit(1)
        .get();

      if (subscriptionSnap.empty) {
        // Create new subscription
        await adminDb.collection('subscriptions').add({
          driverId,
          planId,
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          createdBy: session.userId,
        });
      } else {
        // Update existing subscription
        const subscriptionDoc = subscriptionSnap.docs[0];
        await subscriptionDoc.ref.update({
          planId,
          updatedAt: new Date().toISOString(),
          updatedBy: session.userId,
        });
      }

      // Create notification for driver
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'plan_changed',
          title: 'Plano Alterado',
          message: `Seu plano foi alterado para ${planData?.name}.`,
          read: false,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        });

      return res.status(200).json({ 
        success: true, 
        message: 'Plan changed successfully' 
      });

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error: any) {
    console.error('Error in driver approval:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
