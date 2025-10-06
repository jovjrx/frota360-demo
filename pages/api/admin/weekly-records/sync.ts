import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getFirestore } from 'firebase-admin/firestore';
import { calculateDriverWeeklyRecord } from '@/schemas/driver-weekly-record';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação admin
    const session = await getSession(req, res);
    if (!session?.isLoggedIn || !(session as any).isAdmin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = getFirestore();

    // Buscar todos os motoristas
    const driversSnapshot = await db.collection('drivers').get();
    const drivers = driversSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        name: data.name || data.fullName || 'Unknown',
        iban: data.banking?.iban || '',
        type: data.type || 'affiliate',
        weeklyRent: data.vehicle?.weeklyRent || 0,
        ...data 
      };
    });

    // Para cada motorista, buscar dados das APIs e criar registros semanais
    const weeklyRecords = [];

    for (const driver of drivers) {
      // TODO: Buscar dados de Uber, Bolt, myprio para a semana atual
      // Por enquanto, vamos buscar os registros existentes
      const weekStart = getWeekStart(new Date());
      const weekEnd = getWeekEnd(new Date());

      // Verificar se já existe registro para esta semana
      const existingRecordSnapshot = await db
        .collection('weeklyRecords')
        .where('driverId', '==', driver.id)
        .where('weekStart', '==', weekStart)
        .limit(1)
        .get();

      if (!existingRecordSnapshot.empty) {
        // Registro já existe, pular
        weeklyRecords.push({ id: existingRecordSnapshot.docs[0].id, ...existingRecordSnapshot.docs[0].data() });
        continue;
      }

      // Criar novo registro semanal
      const newRecord = calculateDriverWeeklyRecord({
        driverId: driver.id,
        driverName: driver.name || 'Unknown',
        weekStart,
        weekEnd,
        uberTotal: 0,
        boltTotal: 0,
        combustivel: 0,
        viaverde: 0,
        aluguel: driver.type === 'renter' ? (driver.weeklyRent || 0) : 0,
        iban: driver.iban,
        paymentStatus: 'pending',
        dataSource: 'auto',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const docRef = await db.collection('weeklyRecords').add(newRecord);
      weeklyRecords.push({ id: docRef.id, ...newRecord });
    }

    return res.status(200).json({
      success: true,
      records: weeklyRecords,
      message: `${weeklyRecords.length} registros sincronizados`,
    });
  } catch (error) {
    console.error('Error syncing weekly records:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getWeekEnd(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  // Para uma semana que começa na segunda-feira (dia 1), o domingo é o dia 7.
  // A lógica para encontrar o domingo da mesma semana que começa na segunda-feira é:
  // Se o dia atual for domingo (0), a diferença para o domingo da semana atual é 0.
  // Se o dia atual for segunda (1), a diferença para o domingo da semana atual é 6.
  // Se o dia atual for terça (2), a diferença para o domingo da semana atual é 5.
  // ...
  // Se o dia atual for sábado (6), a diferença para o domingo da semana atual é 1.
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Calcula o domingo da semana atual
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}
