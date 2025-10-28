import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { DriverPayment } from '@/types/driver-payment';

/**
 * Verifica se está em modo demo
 */
function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Carrega dados demo de pagamentos
 */
function getDemoPayments(weekId: string): any[] {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const paymentsPath = path.join(process.cwd(), 'src/demo/driverPayments');
    const files = fs.readdirSync(paymentsPath);
    
    return files
      .filter((file: string) => file.endsWith('.json'))
      .map((file: string) => {
        const filePath = path.join(paymentsPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const payment = JSON.parse(fileContent);
        
        // Filtrar por weekId se fornecido
        if (weekId && payment.weekId !== weekId) {
          return null;
        }
        
        return payment;
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Erro ao carregar pagamentos demo:', error);
    return [];
  }
}

/**
 * GET /api/admin/weekly/payments?weekId=YYYY-Www
 * Retorna somente os registos já processados (driverPayments) para a semana.
 * Inclui vehicle e paymentInfo para compatibilidade com a UI.
 *
 * POST /api/admin/weekly/payments
 * Marca um pagamento como PAGO - apenas atualiza status, data e opcionais bonus/desconto.
 * Compatível com o payload atual do frontend: { record, payment, actor }.
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const weekId = req.query.weekId as string | undefined;
    if (!weekId) {
      return res.status(400).json({ error: 'weekId is required' });
    }

    try {
      // Verificar se está em modo demo
      if (isDemoMode()) {
        console.log(`[API weekly/payments] Modo demo detectado, carregando pagamentos para semana ${weekId}...`);
        
        const payments = getDemoPayments(weekId);
        
        // Mapear para o formato esperado pela UI (simplificado para demo)
        const records = payments.map((p: any) => ({
          id: p.id || `${p.weekId}_${p.driverId}`,
          driverId: p.driverId,
          driverName: p.driverName || 'Motorista Demo',
          weekId: p.weekId,
          weekStart: p.weekStart || '',
          weekEnd: p.weekEnd || '',
          type: p.type || 'affiliate',
          driverType: p.driverType || 'affiliate',
          vehicle: p.vehicle || 'DEMO-001',
          uberTotal: p.uberTotal || 0,
          boltTotal: p.boltTotal || 0,
          ganhosTotal: p.ganhosTotal || p.totalValue || 0,
          ivaValor: p.ivaValor || 0,
          ganhosMenosIVA: p.ganhosMenosIVA || (p.ganhosTotal || 0),
          despesasAdm: p.despesasAdm || p.adminFeeValue || 0,
          combustivel: p.combustivel || 0,
          viaverde: p.viaverde || 0,
          portagens: p.portagens || 0,
          aluguel: p.aluguel || 0,
          financingDetails: p.financingDetails,
          totalDespesas: p.totalDespesas || 0,
          repasse: p.repasse || ((p.ganhosTotal || 0) * 0.85),
          bonusMetaPending: p.bonusMetaPending || [],
          referralBonusPending: p.referralBonusPending || [],
          commissionPending: p.commissionPending,
          totalBonusAmount: p.totalBonusAmount || 0,
          bonusMetaPaid: p.bonusMetaPaid || [],
          referralBonusPaid: p.referralBonusPaid || [],
          platformData: p.platformData || [],
          paymentStatus: p.paymentStatus || 'pending',
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
          dataSource: p.dataSource || 'payment',
          isLocatario: p.isLocatario || false,
          iban: p.iban,
          paymentInfo: {
            bonusAmount: p.bonusAmount || 0,
            bonusCents: p.bonusCents || 0,
            discountAmount: p.discountAmount || 0,
            discountCents: p.discountCents || 0,
            paymentDate: p.paymentDate,
            proofUrl: p.proofUrl || null,
            proofStoragePath: p.proofStoragePath,
          },
        }));

        return res.status(200).json({ records });
      }

      // 1) Buscar pagamentos da semana
      const paymentsSnap = await adminDb
        .collection('driverPayments')
        .where('weekId', '==', weekId)
        .orderBy('driverName')
        .get();

      const payments = paymentsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      // 2) Buscar dados de drivers para vehicle/type (N simples; baixo volume esperado)
      const driverIds = Array.from(new Set(payments.map((p: any) => p.driverId).filter(Boolean)));
      const driverDocs = await Promise.all(
        driverIds.map((id) => adminDb.collection('drivers').doc(id).get())
      );
      const driversById = new Map<string, any>();
      driverDocs.forEach((doc) => {
        if (doc.exists) driversById.set(doc.id, doc.data());
      });

      // 3) Mapear para o formato esperado pela UI
      const records = payments.map((p: any) => {
        const snapshot = p.recordSnapshot || {};
        const driverData = driversById.get(p.driverId) || {};
        const vehicle = driverData?.vehicle?.plate || driverData?.integrations?.viaverde?.key || '';
        const driverType = (p.isLocatario || snapshot.isLocatario || p.type === 'renter' || snapshot.type === 'renter' || driverData?.type === 'renter')
          ? 'renter'
          : 'affiliate';

        return {
          id: p.recordId || p.id || `${p.weekId}_${p.driverId}`,
          driverId: p.driverId || snapshot.driverId,
          driverName: p.driverName || snapshot.driverName,
          weekId: p.weekId || snapshot.weekId,
          weekStart: p.weekStart || snapshot.weekStart,
          weekEnd: p.weekEnd || snapshot.weekEnd,
          type: p.type || snapshot.type || driverData?.type || 'affiliate',
          driverType,
          vehicle,
          uberTotal: p.uberTotal || 0,
          boltTotal: p.boltTotal || 0,
          ganhosTotal: p.ganhosTotal || snapshot.ganhosTotal || 0,
          ivaValor: p.ivaValor || snapshot.ivaValor || 0,
          ganhosMenosIVA: p.ganhosMenosIVA || snapshot.ganhosMenosIVA || 0,
          despesasAdm: (p.despesasAdm ?? p.adminFeeValue ?? snapshot.despesasAdm ?? 0),
          combustivel: p.combustivel ?? snapshot.combustivel ?? 0,
          viaverde: p.viaverde ?? snapshot.viaverde ?? 0,
          portagens: p.portagens ?? snapshot.portagens ?? snapshot.viaverde ?? 0,
          aluguel: p.aluguel ?? snapshot.aluguel ?? 0,
          financingDetails: p.financingDetails || snapshot.financingDetails,
          totalDespesas: p.totalDespesas || snapshot.totalDespesas || 0,
          repasse: p.repasse || snapshot.repasse || 0,
          bonusMetaPending: p.bonusMetaPending || [],
          referralBonusPending: p.referralBonusPending || [],
          commissionPending: p.commissionPending,
          totalBonusAmount: p.totalBonusAmount || 0,
          bonusMetaPaid: p.bonusMetaPaid || [],
          referralBonusPaid: p.referralBonusPaid || [],
          platformData: p.platformData || [],
          paymentStatus: p.paymentStatus || 'pending',
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
          dataSource: p.dataSource || 'payment',
          isLocatario: p.isLocatario || snapshot.isLocatario || false,
          iban: p.iban || snapshot.iban,
          // Informações de pagamento para UI
          paymentInfo: {
            bonusAmount: p.bonusAmount || 0,
            bonusCents: p.bonusCents || 0,
            discountAmount: p.discountAmount || 0,
            discountCents: p.discountCents || 0,
            paymentDate: p.paymentDate || snapshot.paymentDate,
            // ✅ CORRIGIDO: Busca em múltiplas localizações possíveis
            proofUrl: p.proofUrl 
              || snapshot.proofUrl 
              || (p.paymentInfo?.proofs && p.paymentInfo.proofs[0]?.url)
              || null,
            proofStoragePath: p.proofStoragePath 
              || snapshot.proofStoragePath 
              || (p.paymentInfo?.proofs && p.paymentInfo.proofs[0]?.storagePath)
              || null,
            proofFileName: p.proofFileName 
              || snapshot.proofFileName 
              || (p.paymentInfo?.proofs && p.paymentInfo.proofs[0]?.filename)
              || null,
          },
        };
      });

      return res.status(200).json({ records });
    } catch (error: any) {
      console.error('❌ Erro ao obter pagamentos:', error);
      return res.status(500).json({ error: error?.message || 'Failed to get payments' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Payload compatível com o frontend atual
      const { record, payment, actor } = req.body as {
        record?: any;
        payment?: {
          bonusAmount?: number;
          discountAmount?: number;
          paymentDate?: string;
          notes?: string;
          iban?: string | null;
          proof?: {
            url: string;
            storagePath: string;
            fileName: string;
            size: number;
            contentType?: string;
            uploadedAt: string;
          };
        };
        actor?: { uid?: string; email?: string; name?: string };
      };

      const driverId = record?.driverId || req.body?.driverId;
      const weekId = record?.weekId || req.body?.weekId;

      if (!driverId || !weekId) {
        return res.status(400).json({ error: 'driverId and weekId are required' });
      }

      // Buscar driverPayment existente
      const paymentSnap = await adminDb
        .collection('driverPayments')
        .where('driverId', '==', driverId)
        .where('weekId', '==', weekId)
        .limit(1)
        .get();

      if (paymentSnap.empty) {
        return res.status(404).json({
          error: 'Payment not found. Process the week first to create driverPayments.'
        });
      }

      const paymentDoc = paymentSnap.docs[0];
      const current = paymentDoc.data() as DriverPayment & { [k: string]: any };

      const nowIso = new Date().toISOString();
      const bonusAmount = Math.max(0, Number(payment?.bonusAmount || 0));
      const discountAmount = Math.max(0, Number(payment?.discountAmount || 0));
      const bonusCents = Math.round(bonusAmount * 100);
      const discountCents = Math.round(discountAmount * 100);
      const baseCents = Number(current.baseAmountCents || 0);
      const totalCents = baseCents + bonusCents - discountCents;

      const updatedPayment: Partial<DriverPayment> & { [k: string]: any } = {
        paymentStatus: 'paid',
        paymentDate: payment?.paymentDate || nowIso,
        notes: payment?.notes ?? current.notes,
        iban: payment?.iban ?? current.iban,
        bonusAmount,
        bonusCents,
        discountAmount,
        discountCents,
        totalAmountCents: totalCents,
        totalAmount: totalCents / 100,
        updatedAt: nowIso,
      };

      if (payment?.proof) {
        updatedPayment.proofUrl = payment.proof.url;
        updatedPayment.proofStoragePath = payment.proof.storagePath;
        updatedPayment.proofFileName = payment.proof.fileName;
        updatedPayment.proofFileSize = payment.proof.size;
        updatedPayment.proofContentType = payment.proof.contentType;
        updatedPayment.proofUploadedAt = payment.proof.uploadedAt;
        
        // ✅ Sincronizar também para paymentInfo.proofs para manter compatibilidade
        const proofInfo = {
          filename: payment.proof.fileName,
          url: payment.proof.url,
          size: String(payment.proof.size),
          storagePath: payment.proof.storagePath,
          contentType: payment.proof.contentType,
          uploadedAt: payment.proof.uploadedAt,
        };
        
        updatedPayment.paymentInfo = {
          ...(current.paymentInfo || {}),
          proofs: [proofInfo],
          proofCount: 1,
          uploadedAt: payment.proof.uploadedAt,
        };
      }

      await paymentDoc.ref.update(updatedPayment);

      // Resposta compatível com a UI
      return res.status(200).json({
        success: true,
        record: {
          id: record?.id || `${weekId}_${driverId}`,
          paymentStatus: 'paid',
          paymentDate: updatedPayment.paymentDate,
          updatedAt: nowIso,
        },
        payment: { ...current, ...updatedPayment },
      });
    } catch (error: any) {
      console.error('❌ Erro ao marcar pagamento como pago:', error);
      return res.status(500).json({
        error: 'Failed to mark payment as paid',
        message: error?.message || 'Internal error',
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

