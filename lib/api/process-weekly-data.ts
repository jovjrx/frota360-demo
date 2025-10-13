/**
 * Função compartilhada para processar dados semanais
 * Usada tanto pelo endpoint /api/admin/weekly/data quanto pelo SSR do dashboard
 */

import { adminDb } from '@/lib/firebaseAdmin';

export async function processWeeklyData(weekId: string) {
  try {
    // Fazer requisição ao endpoint que já processa tudo corretamente
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/admin/weekly/data?weekId=${weekId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch weekly data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Se falhar o fetch (desenvolvimento/Vercel), processar diretamente
    console.warn(`Fetch falhou, processando dados diretamente:`, error);
    
    // Buscar dados do dataWeekly para a semana
    const normalizedSnapshot = await adminDb
      .collection('dataWeekly')
      .where('weekId', '==', weekId)
      .get();

    if (normalizedSnapshot.empty) {
      return { records: [] };
    }

    // Retornar estrutura básica - os cálculos serão feitos no cliente
    const records: any[] = [];
    
    // Agrupar por motorista
    const byDriver = new Map<string, any>();
    
    normalizedSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const driverId = data.driverId || 'unknown';
      
      if (!byDriver.has(driverId)) {
        byDriver.set(driverId, {
          driverId,
          driverName: data.driverName || 'Desconhecido',
          ganhosTotal: 0,
          repasse: 0,
          despesasAdm: 0,
          aluguel: 0,
          paymentStatus: 'pending',
          financingDetails: { installment: 0 }
        });
      }
      
      const rec = byDriver.get(driverId);
      rec.ganhosTotal += data.totalValue || 0;
    });

    // Buscar dados dos motoristas para calcular corretamente
    const driversSnapshot = await adminDb.collection('drivers').get();
    const driversMap = new Map();
    
    driversSnapshot.docs.forEach(doc => {
      driversMap.set(doc.id, {
        type: doc.data().type || 'affiliate',
        rentalFee: doc.data().rentalFee || 0
      });
    });

    // Buscar financiamentos ativos
    const financingSnapshot = await adminDb
      .collection('financing')
      .where('status', '==', 'active')
      .get();
    
    const financingMap = new Map();
    financingSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.driverId) {
        if (!financingMap.has(data.driverId)) {
          financingMap.set(data.driverId, { interestPercent: 0, installment: 0 });
        }
        const f = financingMap.get(data.driverId);
        f.interestPercent += data.weeklyInterest || 0;
        f.installment += data.weeklyAmount || 0;
      }
    });

    // Calcular valores para cada motorista
    byDriver.forEach((rec, driverId) => {
      const driver = driversMap.get(driverId);
      const financing = financingMap.get(driverId);
      
      if (!driver) return;
      
      const ivaValor = rec.ganhosTotal * 0.06;
      const ganhosMenosIVA = rec.ganhosTotal - ivaValor;
      
      let despesasAdm = ganhosMenosIVA * 0.07;
      
      if (financing && financing.interestPercent > 0) {
        despesasAdm += ganhosMenosIVA * (financing.interestPercent / 100);
      }
      
      const aluguel = driver.type === 'renter' ? driver.rentalFee : 0;
      const installment = financing?.installment || 0;
      
      let repasse = ganhosMenosIVA - despesasAdm - aluguel;
      if (installment > 0) {
        repasse -= installment;
      }
      
      rec.despesasAdm = despesasAdm;
      rec.aluguel = aluguel;
      rec.repasse = repasse;
      rec.financingDetails = { installment };
      
      records.push(rec);
    });

    return { records };
  }
}
