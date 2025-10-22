/**
 * SERVICE: Referral Manager
 * Gerencia convites de recrutamento e árvore de afiliação
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { ReferralInvite, AffiliateNetwork, generateInviteCode } from '@/schemas/referral';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Gerar novo convite de recrutamento
 */
export async function createReferralInvite(
  referrerId: string,
  referrerName: string,
  email?: string,
  phone?: string
): Promise<ReferralInvite> {
  try {
    const inviteCode = generateInviteCode(referrerId);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 dias

    const invite: ReferralInvite = {
      referrerId,
      referrerName,
      inviteCode,
      email,
      phone,
      status: 'pending',
      createdAt: now,
      expiresAt,
    };

    const docRef = adminDb.collection('referralInvites').doc();
    await docRef.set(invite);

    console.log(`[createReferralInvite] Convite criado: ${inviteCode}`);
    return { ...invite, id: docRef.id };
  } catch (error) {
    console.error(`[createReferralInvite] Erro:`, error);
    throw error;
  }
}

/**
 * Validar e aceitar convite de recrutamento
 */
export async function acceptReferralInvite(
  inviteCode: string,
  driverId: string,
  driverName: string,
  driverEmail: string
): Promise<{ success: boolean; message: string; referrerId?: string }> {
  try {
    // 1. Buscar convite
    const inviteSnapshot = await adminDb
      .collection('referralInvites')
      .where('inviteCode', '==', inviteCode)
      .limit(1)
      .get();

    if (inviteSnapshot.empty) {
      return { success: false, message: 'Código de convite inválido' };
    }

    const inviteDoc = inviteSnapshot.docs[0];
    const invite = inviteDoc.data() as ReferralInvite;

    // 2. Validar status
    if (invite.status !== 'pending') {
      return { success: false, message: `Convite já foi ${invite.status === 'accepted' ? 'aceito' : 'expirado'}` };
    }

    // 3. Validar expiração
    if (new Date(invite.expiresAt) < new Date()) {
      await inviteDoc.ref.update({ status: 'expired' });
      return { success: false, message: 'Convite expirado' };
    }

    // 4. Aceitar convite
    const now = new Date().toISOString();
    await inviteDoc.ref.update({
      status: 'accepted',
      acceptedAt: now,
      acceptedByDriverId: driverId,
      acceptedByDriverName: driverName,
    });

    // 5. Atualizar dados do motorista (inclui referredBy para cadeia de comissões)
    await adminDb.collection('drivers').doc(driverId).update({
      recruitedBy: invite.referrerId,
      recruitedAt: now,
      referredBy: invite.referrerId,
    });

    // 6. Incrementar contadores do recrutador
    await adminDb.collection('drivers').doc(invite.referrerId).update({
      totalRecruitments: FieldValue.increment(1),
      activeRecruitments: FieldValue.increment(1),
    });

    // 7. Atualizar rede de afiliação
    await updateAffiliateNetwork(invite.referrerId, driverId, driverName, driverEmail);

    console.log(`[acceptReferralInvite] Convite aceito: ${inviteCode}`);
    return { success: true, message: 'Convite aceito com sucesso', referrerId: invite.referrerId };
  } catch (error) {
    console.error(`[acceptReferralInvite] Erro:`, error);
    return { success: false, message: 'Erro ao aceitar convite' };
  }
}

/**
 * Atualizar rede de afiliação quando um motorista é recrutado
 */
async function updateAffiliateNetwork(
  referrerId: string,
  newDriverId: string,
  newDriverName: string,
  newDriverEmail: string
): Promise<void> {
  try {
    // Buscar ou criar rede do recrutador
    const networkSnapshot = await adminDb
      .collection('affiliateNetworks')
      .where('driverId', '==', referrerId)
      .limit(1)
      .get();

    if (networkSnapshot.empty) {
      // Criar nova rede
      const network: AffiliateNetwork = {
        driverId: referrerId,
        driverName: '',
        driverEmail: '',
        recruitedDrivers: [
          {
            driverId: newDriverId,
            driverName: newDriverName,
            driverEmail: newDriverEmail,
            recruitedDate: new Date().toISOString(),
            status: 'active',
            currentLevel: 1,
          },
        ],
        totalRecruitments: 1,
        activeRecruitments: 1,
        affiliateLevel: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await adminDb.collection('affiliateNetworks').doc().set(network);
    } else {
      // Atualizar rede existente
      const networkDoc = networkSnapshot.docs[0];
      const network = networkDoc.data() as AffiliateNetwork;

      const updatedRecruitedDrivers = [
        ...network.recruitedDrivers,
        {
          driverId: newDriverId,
          driverName: newDriverName,
          driverEmail: newDriverEmail,
          recruitedDate: new Date().toISOString(),
          status: 'active',
          currentLevel: 1,
        },
      ];

      await networkDoc.ref.update({
        recruitedDrivers: updatedRecruitedDrivers,
        totalRecruitments: network.totalRecruitments + 1,
        activeRecruitments: network.activeRecruitments + 1,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error(`[updateAffiliateNetwork] Erro:`, error);
  }
}

/**
 * Buscar rede de afiliação de um motorista
 */
export async function getAffiliateNetwork(driverId: string): Promise<AffiliateNetwork | null> {
  try {
    const snapshot = await adminDb
      .collection('affiliateNetworks')
      .where('driverId', '==', driverId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as AffiliateNetwork;
  } catch (error) {
    console.error(`[getAffiliateNetwork] Erro:`, error);
    return null;
  }
}

/**
 * Buscar convites pendentes de um referenciador
 */
export async function getPendingInvites(referrerId: string): Promise<ReferralInvite[]> {
  try {
    const snapshot = await adminDb
      .collection('referralInvites')
      .where('referrerId', '==', referrerId)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as ReferralInvite));
  } catch (error) {
    console.error(`[getPendingInvites] Erro:`, error);
    return [];
  }
}

/**
 * Buscar todos os convites de um referenciador
 */
export async function getAllInvites(referrerId: string): Promise<ReferralInvite[]> {
  try {
    const snapshot = await adminDb
      .collection('referralInvites')
      .where('referrerId', '==', referrerId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as ReferralInvite));
  } catch (error) {
    console.error(`[getAllInvites] Erro:`, error);
    return [];
  }
}

/**
 * Contar recrutamentos ativos de um motorista no trimestre
 */
export async function countRecruitmentsSinceDate(driverId: string, sinceDate: string): Promise<number> {
  try {
    const snapshot = await adminDb
      .collection('drivers')
      .where('recruitedBy', '==', driverId)
      .where('recruitedAt', '>=', sinceDate)
      .where('status', '==', 'active')
      .get();

    return snapshot.size;
  } catch (error) {
    console.error(`[countRecruitmentsSinceDate] Erro:`, error);
    return 0;
  }
}

/**
 * Atualizar status de recrutado quando motorista muda de status
 */
export async function updateRecruitedDriverStatus(driverId: string, newStatus: string): Promise<void> {
  try {
    // Buscar todas as redes que contêm este motorista
    const networksSnapshot = await adminDb
      .collection('affiliateNetworks')
      .get();

    const batch = adminDb.batch();

    for (const networkDoc of networksSnapshot.docs) {
      const network = networkDoc.data() as AffiliateNetwork;
      const recruitedIndex = network.recruitedDrivers.findIndex(r => r.driverId === driverId);

      if (recruitedIndex !== -1) {
        const updatedRecruitedDrivers = [...network.recruitedDrivers];
        updatedRecruitedDrivers[recruitedIndex].status = newStatus as 'active' | 'inactive' | 'suspended';

        // Recalcular ativos
        const activeCount = updatedRecruitedDrivers.filter(r => r.status === 'active').length;

        batch.update(networkDoc.ref, {
          recruitedDrivers: updatedRecruitedDrivers,
          activeRecruitments: activeCount,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await batch.commit();
    console.log(`[updateRecruitedDriverStatus] Status atualizado para ${driverId}: ${newStatus}`);
  } catch (error) {
    console.error(`[updateRecruitedDriverStatus] Erro:`, error);
  }
}

