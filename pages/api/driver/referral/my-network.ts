/**
 * API: GET /api/driver/referral/my-network
 * Busca rede de recrutamento do motorista
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getAffiliateNetwork, getAllInvites } from '@/lib/services/referral-manager';
import { getSession } from '@/lib/session/ironSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getSession(req, res);
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const userEmail = session.userId;

    // Buscar motorista
    const driverSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (driverSnapshot.empty) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }

    const driver = driverSnapshot.docs[0].data();
    const driverId = driverSnapshot.docs[0].id;

    // Apenas afiliados têm rede
    if (driver.type !== 'affiliate') {
      return res.status(403).json({ error: 'Apenas afiliados têm rede de recrutamento' });
    }

    // Buscar rede
    const network = await getAffiliateNetwork(driverId);
    const invites = await getAllInvites(driverId);

    return res.status(200).json({
      success: true,
      driver: {
        id: driverId,
        name: driver.fullName || driver.name,
        affiliateLevel: driver.affiliateLevel || 1,
        refSlug: driver.refSlug || null,
      },
      network: network ? {
        totalRecruitments: network.totalRecruitments,
        activeRecruitments: network.activeRecruitments,
        recruitedDrivers: network.recruitedDrivers.map(r => ({
          driverId: r.driverId,
          driverName: r.driverName,
          driverEmail: r.driverEmail,
          recruitedDate: r.recruitedDate,
          status: r.status,
          currentLevel: r.currentLevel,
        })),
      } : {
        totalRecruitments: 0,
        activeRecruitments: 0,
        recruitedDrivers: [],
      },
      invites: invites.map(i => ({
        id: i.id,
        inviteCode: i.inviteCode,
        email: i.email,
        phone: i.phone,
        status: i.status,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt,
        acceptedAt: i.acceptedAt,
        acceptedByDriverName: i.acceptedByDriverName,
      })),
    });
  } catch (error: any) {
    console.error('[/api/driver/referral/my-network]', error);
    return res.status(500).json({ error: 'Erro ao buscar rede' });
  }
}

