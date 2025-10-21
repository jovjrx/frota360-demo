import { NextApiResponse } from 'next';
import { SessionRequest } from '@/lib/session/ironSession';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { UpdateDriverAdminSchema } from '@/schemas/driver';
import { z } from 'zod';
import { getPortugalTimestamp } from '@/lib/timezone';
import { emailService } from '@/lib/email/mailer';

export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = getFirestore(firebaseAdmin);
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: 'Driver ID is required' });
    }

    // ✅ Criar schema mais flexível para atualização
    const FlexibleUpdateSchema = z.object({
      // Campos básicos
      status: z.enum(['pending', 'active', 'inactive', 'suspended']).optional(),
      type: z.enum(['affiliate', 'renter']).optional(),
      fullName: z.string().optional(),
      name: z.string().optional(), // Para compatibilidade
      email: z.string().email().optional(),
      phone: z.string().optional(),
      birthDate: z.string().optional(),
      city: z.string().optional(),
      rentalFee: z.number().optional(),
      
      // Integrações (objeto flexível)
      integrations: z.any().optional(),
      
      // Dados bancários (objeto flexível)
      banking: z.any().optional(),
      
      // Veículo (objeto flexível)
      vehicle: z.any().optional(),
      
      // Alteração de senha (admin)
      newPassword: z.string().min(6).optional(),
    });

    const validationResult = FlexibleUpdateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.error('❌ Erro de validação:', validationResult.error);
      console.error('📝 Dados recebidos:', req.body);
      return res.status(400).json({ 
        success: false,
        error: 'Validation error',
        details: validationResult.error 
      });
    }
    
  const validatedData = validationResult.data;
    const now = getPortugalTimestamp();

    // Check if driver exists
    const driverRef = db.collection('drivers').doc(id);
    const existingDriverDoc = await driverRef.get();
    if (!existingDriverDoc.exists) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    const existingDriver = existingDriverDoc.data();

    // Prepare update data
    const updateFields: any = {
      ...validatedData,
      updatedAt: now,
    };

    // Update status related fields only if status is being changed
    if (validatedData.status && validatedData.status !== existingDriver?.status) {
      updateFields.statusUpdatedAt = now;
      updateFields.statusUpdatedBy = user.id;
    }

    // Caso o admin tenha solicitado alteração de senha
    if (validatedData.newPassword) {
      const adminAuth = getAuth(firebaseAdmin);
      let firebaseUid: string | undefined = (existingDriver as any)?.firebaseUid;
      const driverEmail: string | undefined = (existingDriver as any)?.email;
      const driverName: string = (existingDriver as any)?.fullName || (existingDriver as any)?.name || 'Motorista';

      try {
        if (!firebaseUid && driverEmail) {
          const userRecord = await adminAuth.getUserByEmail(driverEmail);
          firebaseUid = userRecord.uid;
        }
      } catch (lookupErr) {
        // Se não encontrou o usuário no Auth, não podemos alterar a senha
        return res.status(404).json({ success: false, error: 'Usuário de autenticação não encontrado para este motorista' });
      }

      if (!firebaseUid) {
        return res.status(404).json({ success: false, error: 'Usuário de autenticação não encontrado para este motorista' });
      }

      await adminAuth.updateUser(firebaseUid, { password: validatedData.newPassword });

      // Notificar por email com a nova senha
      if (driverEmail) {
        try {
          // Reutiliza template de credenciais para enviar a nova senha
          await emailService.sendDriverCredentialsEmail(driverEmail, driverName, validatedData.newPassword);
        } catch (emailErr) {
          // prosseguir mesmo se falhar o email
          console.warn('Falha ao enviar email de alteração de senha:', emailErr);
        }
      }
    }

    // Remover chave sensível do payload antes de salvar no Firestore
    if (updateFields.newPassword) {
      delete updateFields.newPassword;
    }

    await driverRef.update(updateFields);

    // Log audit trail
    await db.collection('audit_logs').add({
      action: 'driver_update',
      driverId: id,
      adminId: user.id,
      oldData: existingDriver,
      newData: updateFields,
      timestamp: now,
      createdAt: now,
    });

    res.status(200).json({ 
      success: true,
      message: 'Driver updated successfully',
      passwordChanged: Boolean(validatedData.newPassword),
    });
  } catch (error: any) {
    console.error('Update driver admin fields error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false,
        error: 'Validation error',
        details: error.errors 
      });
    }
    
    res.status(500).json({ success: false, error: error.message || 'Failed to update driver' });
  }
}, sessionOptions);
