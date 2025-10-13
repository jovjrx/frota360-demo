import { adminDb } from '@/lib/firebaseAdmin';
import { getDriverWeekData } from '@/lib/api/driver-week-data';

/**
 * Busca os dados do motorista no Firestore
 */
export async function getDriverData(driverId: string) {
  try {
    // Buscar motorista pelo email (driverId é o email)
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', driverId)
      .limit(1)
      .get();

    if (driversSnapshot.empty) {
      return null;
    }

    const driverDoc = driversSnapshot.docs[0];
    const driverData = driverDoc.data();

    // Verificar se está ativo
    if (driverData.status !== 'active') {
      return null;
    }

    // Retornar dados do motorista (mesmo formato da API)
    return {
      id: driverDoc.id,
      
      // Dados pessoais
      firstName: driverData.firstName || '',
      lastName: driverData.lastName || '',
      fullName: driverData.fullName || `${driverData.firstName} ${driverData.lastName}`,
      email: driverData.email || '',
      phone: driverData.phone || '',
      birthDate: driverData.birthDate || null,
      city: driverData.city || '',
      
      // Status
      status: driverData.status || 'pending',
      type: driverData.type || 'affiliate',
      
      // Dados bancários (IBAN mascarado)
      banking: {
        iban: driverData.banking?.iban 
          ? maskIban(driverData.banking.iban) 
          : null,
        accountHolder: driverData.banking?.accountHolder || null,
      },
      
      // Veículo (se locatário)
      vehicle: driverData.type === 'renter' ? {
        plate: driverData.vehicle?.plate || null,
        model: driverData.vehicle?.model || null,
        assignedDate: driverData.vehicle?.assignedDate || null,
      } : null,
      
      // Aluguel (se locatário)
      rentalFee: driverData.type === 'renter' ? (driverData.rentalFee || 0) : 0,
      
      // Datas
      createdAt: driverData.createdAt || null,
      activatedAt: driverData.activatedAt || null,
    };

  } catch (error) {
    console.error('Erro ao buscar dados do motorista:', error);
    return null;
  }
}

/**
 * Busca os contracheques do motorista
 */
/**
 * Busca os contracheques do motorista
 * ATUALIZADO: Usa função centralizada getDriverWeekData para sempre ter dados frescos
 */
export async function getDriverContracheques(driverId: string, limit: number = 12) {
  try {
    // Primeiro, buscar o documento do motorista para obter o ID real
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', driverId)
      .limit(1)
      .get();

    if (driversSnapshot.empty) {
      return [];
    }

    const driverDoc = driversSnapshot.docs[0];
    const realDriverId = driverDoc.id; // Usar o ID do documento

    // Buscar todos os registros semanais do motorista
    const query = adminDb
      .collection('driverWeeklyRecords')
      .where('driverId', '==', realDriverId);

    const recordsSnapshot = await query.get();
    
    // Ordenar em memória por data (mais recente primeiro) e limitar
    const sortedRecords = recordsSnapshot.docs
      .map(doc => ({ 
        id: doc.id,
        weekId: doc.data().weekId,
        weekStart: doc.data().weekStart,
        paymentStatus: doc.data().paymentStatus,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.weekStart || '');
        const dateB = new Date(b.weekStart || '');
        return dateB.getTime() - dateA.getTime(); // desc
      })
      .slice(0, limit);
    
    // Para cada registro, buscar dados ATUALIZADOS usando função centralizada
    const contracheques = await Promise.all(
      sortedRecords.map(async (record) => {
        const weekId = record.weekId;
        
        // Usar função centralizada para ter dados sempre frescos!
        const freshData = await getDriverWeekData(realDriverId, weekId, false);
        
        if (!freshData) {
          // Fallback: se não conseguiu buscar dados frescos, retornar null
          console.warn(`[getDriverContracheques] Não foi possível buscar dados para ${realDriverId} semana ${weekId}`);
          return null;
        }
        
        return {
          id: record.id,
          weekId: freshData.weekId,
          weekStart: freshData.weekStart,
          weekEnd: freshData.weekEnd,
          
          // Receitas (SEMPRE ATUALIZADAS do dataWeekly)
          uberTotal: freshData.uberTotal || 0,
          boltTotal: freshData.boltTotal || 0,
          ganhosTotal: freshData.ganhosTotal || 0,
          
          // Cálculos
          ivaValor: freshData.ivaValor || 0,
          ganhosMenosIVA: freshData.ganhosMenosIVA || 0,
          despesasAdm: freshData.despesasAdm || 0,
          
          // Despesas
          combustivel: freshData.combustivel || 0,
          viaverde: freshData.viaverde || 0,
          aluguel: freshData.aluguel || 0,
          totalDespesas: freshData.totalDespesas || 0,
          
          // Repasse
          repasse: freshData.repasse || 0,
          
          // Pagamento (dados fixos)
          iban: freshData.iban || null,
          paymentStatus: freshData.paymentStatus || 'pending',
          paymentDate: freshData.paymentDate || null,
          paymentInfo: freshData.paymentInfo || null,
          
          // Metadados
          createdAt: freshData.createdAt || null,
          updatedAt: freshData.updatedAt || null,
        };
      })
    );

    // Filtrar nulls (casos onde não conseguiu buscar dados)
    return contracheques.filter(c => c !== null);

  } catch (error) {
    console.error('[getDriverContracheques] Erro ao buscar contracheques:', error);
    return [];
  }
}

/**
 * Mascara o IBAN mostrando apenas os primeiros 4 e últimos 2 dígitos
 * Exemplo: PT50003300004555698867005 → PT50 **** **** **** **05
 */
function maskIban(iban: string): string {
  if (!iban || iban.length < 6) return iban;
  
  const first4 = iban.substring(0, 4);
  const last2 = iban.substring(iban.length - 2);
  const middle = '*'.repeat(Math.max(0, iban.length - 6));
  
  // Formatar com espaços a cada 4 caracteres
  const masked = first4 + middle + last2;
  return masked.match(/.{1,4}/g)?.join(' ') || masked;
}