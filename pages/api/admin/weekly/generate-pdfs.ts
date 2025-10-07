import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { generatePayslipPDF, PayslipData } from '@/lib/pdf/payslipGenerator';
import archiver from 'archiver';
import { Readable } from 'stream';

// Inicializar Firebase Admin
if (!getApps().length) {
  const serviceAccount = require('@/firebase-service-account.json');
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { weekStart, weekEnd } = req.body;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart e weekEnd são obrigatórios' });
    }

    const db = getFirestore();

    // Buscar registros da semana
    const recordsSnapshot = await db
      .collection('weeklyRecords')
      .where('weekStart', '==', weekStart)
      .where('weekEnd', '==', weekEnd)
      .get();

    if (recordsSnapshot.empty) {
      return res.status(404).json({ error: 'Nenhum registro encontrado para esta semana' });
    }

    // Criar ZIP
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=Resumos_${weekStart}_a_${weekEnd}.zip`);

    archive.pipe(res);

    // Gerar PDF para cada motorista
    for (const doc of recordsSnapshot.docs) {
      const data = doc.data();
      
      // Buscar dados do motorista
      const driverDoc = await db.collection('drivers').doc(data.driverId).get();
      const driverData = driverDoc.data();

      if (!driverData) {
        console.warn(`Motorista ${data.driverId} não encontrado`);
        continue;
      }

      // Calcular valores
      const uberTotal = data.uber?.total || 0;
      const boltTotal = data.bolt?.total || 0;
      const ganhosTotal = uberTotal + boltTotal;
      const ivaValor = ganhosTotal * 0.06;
      const ganhosMenosIva = ganhosTotal - ivaValor;
      const comissao = ganhosMenosIva * 0.07;
      const combustivel = data.fuel?.total || 0;
      const viaverde = data.viaverde?.total || 0;
      const aluguel = driverData.type === 'renter' ? (data.rent || 290) : 0;
      const repasse = ganhosMenosIva - comissao - combustivel - viaverde - aluguel;

      // Preparar dados para o PDF
      const payslipData: PayslipData = {
        driverName: data.driverName || driverData.name || 'N/A',
        driverType: driverData.type || 'affiliate',
        vehiclePlate: driverData.vehicle?.plate || 'N/A',
        weekStart: formatDate(data.weekStart),
        weekEnd: formatDate(data.weekEnd),
        uberTotal,
        boltTotal,
        ganhosTotal,
        ivaValor,
        ganhosMenosIva,
        comissao,
        combustivel,
        viaverde,
        aluguel,
        repasse,
        iban: driverData.banking?.iban || 'N/A',
        status: data.payment?.status || 'pending',
      };

      // Gerar PDF
      const pdfBuffer = await generatePayslipPDF(payslipData);

      // Nome do arquivo (sanitizar nome do motorista)
      const sanitizedName = data.driverName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      const fileName = `Resumo_${sanitizedName}_${weekStart}_a_${weekEnd}.pdf`;

      // Adicionar ao ZIP
      archive.append(pdfBuffer, { name: fileName });
    }

    // Finalizar ZIP
    await archive.finalize();

  } catch (error) {
    console.error('Erro ao gerar PDFs:', error);
    
    // Se já começou a enviar o ZIP, não podemos enviar JSON
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao gerar PDFs' });
    }
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
