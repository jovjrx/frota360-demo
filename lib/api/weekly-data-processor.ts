import { adminDb } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

/**
 * Processa dados de uma semana específica do rawFileArchive
 * Retorna array de registros processados da driverWeeklyRecords
 */
export async function getProcessedWeeklyRecords(weekId: string): Promise<DriverWeeklyRecord[]> {
  if (!weekId) {
    return [];
  }

  try {
    // Buscar registros processados da semana
    const recordsSnapshot = await adminDb
      .collection('driverWeeklyRecords')
      .where('weekId', '==', weekId)
      .get();

    const records: DriverWeeklyRecord[] = [];
    
    recordsSnapshot.docs.forEach(doc => {
      const data = doc.data() as DriverWeeklyRecord;
      records.push({
        id: doc.id,
        ...data
      });
    });

    return records;
  } catch (error) {
    console.error(`Erro ao processar registros da semana ${weekId}:`, error);
    return [];
  }
}

/**
 * Busca os IDs das últimas N semanas disponíveis no rawFileArchive
 */
export async function getAvailableWeekIds(limit: number = 10): Promise<string[]> {
  try {
    const rawSnapshot = await adminDb
      .collection('rawFileArchive')
      .orderBy('weekStart', 'desc')
      .limit(50)
      .get();

    const weekIdsWithDates = new Map<string, string>();
    
    rawSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.weekId && data.weekStart) {
        weekIdsWithDates.set(data.weekId, data.weekStart);
      }
    });
    
    const sortedWeekIds = Array.from(weekIdsWithDates.entries())
      .sort((a, b) => b[1].localeCompare(a[1]))
      .map(entry => entry[0])
      .slice(0, limit);
    
    return sortedWeekIds;
  } catch (error) {
    console.error('Erro ao buscar semanas disponíveis:', error);
    return [];
  }
}
