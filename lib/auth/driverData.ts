import { adminDb } from '@/lib/firebaseAdmin';

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
export async function getDriverContracheques(driverId: string, limit: number = 12) {
  try {
    // Primeiro, buscar o documento do motorista para obter o ID real
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', driverId)
      .limit(1)
      .get();

    if (driversSnapshot.empty) {
      console.warn('Motorista não encontrado para contracheques:', driverId);
      return [];
    }

    const driverDoc = driversSnapshot.docs[0];
    const realDriverId = driverDoc.id; // Usar o ID do documento

    // Buscar registros semanais usando o ID do documento
    const query = adminDb
      .collection('driverWeeklyRecords')
      .where('driverId', '==', realDriverId)
      .orderBy('weekStart', 'desc')
      .limit(limit);

    const recordsSnapshot = await query.get();

    // Mapear registros
    const contracheques = recordsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        weekId: data.weekId,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        
        // Receitas
        uberTotal: data.uberTotal || 0,
        boltTotal: data.boltTotal || 0,
        ganhosTotal: data.ganhosTotal || 0,
        
        // Cálculos
        ivaValor: data.ivaValor || 0,
        ganhosMenosIVA: data.ganhosMenosIVA || 0,
        despesasAdm: data.despesasAdm || 0,
        
        // Despesas
        combustivel: data.combustivel || 0,
        viaverde: data.viaverde || 0,
        aluguel: data.aluguel || 0,
        totalDespesas: data.totalDespesas || 0,
        
        // Repasse
        repasse: data.repasse || 0,
        
        // Pagamento
        iban: data.iban || null,
        paymentStatus: data.paymentStatus || 'pending',
        paymentDate: data.paymentDate || null,
        
        // Metadados
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      };
    });

    return contracheques;

  } catch (error) {
    console.error('Erro ao buscar contracheques:', error);
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