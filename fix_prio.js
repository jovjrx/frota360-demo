const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join('/home/ubuntu/conduz-pt', 'conduz-pt.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

function normalizeKey(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase();
}

function normalizePlate(value) {
  if (!value) return '';
  return String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const str = String(value).trim();
  if (!str) return 0;
  let normalized = str.replace(/\s/g, '').replace(/[€$]/g, '');
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = normalized.replace(/,/g, '');
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fixPrio() {
  try {
    console.log('🔧 Corrigindo processamento PRIO\n');
    
    const weekId = '2025-W40';
    
    // Buscar dados brutos do PRIO
    const rawSnapshot = await db.collection('rawFileArchive')
      .where('weekId', '==', weekId)
      .where('platform', '==', 'myprio')
      .get();
    
    if (rawSnapshot.empty) {
      console.log('❌ Nenhum dado PRIO encontrado');
      return;
    }
    
    const rawDoc = rawSnapshot.docs[0];
    const rawData = rawDoc.data();
    
    console.log(`📊 Arquivo: ${rawData.fileName}`);
    console.log(`Linhas: ${rawData.rawData.rows.length}\n`);
    
    const aggregates = new Map();
    
    rawData.rawData.rows.forEach((row, i) => {
      const card = row['CARTAO'] || row['CARTÃO'] || row['Cartão'];
      const descCard = row['DESC CARTAO'] || row['DESC CARTÃO'];
      const total = row['TOTAL'] || row['Total'];
      
      console.log(`Linha ${i + 1}:`);
      console.log(`  Cartão: ${card}`);
      console.log(`  Desc: ${descCard}`);
      console.log(`  Total: ${total}`);
      
      // Usar cartão como identificador principal
      if (!card) {
        console.log(`  ⚠️  Sem cartão, pulando\n`);
        return;
      }
      
      // Usar DESC CARTAO como placa se não for "."
      let plate = descCard && descCard !== '.' ? descCard : null;
      
      const key = normalizeKey(card);
      const entry = aggregates.get(key) || {
        referenceId: String(card).trim(),
        referenceLabel: plate,
        vehiclePlate: plate,
        totalValue: 0
      };
      
      entry.totalValue += parseNumber(total);
      aggregates.set(key, entry);
      
      console.log(`  ✅ Agregado: €${parseNumber(total)}\n`);
    });
    
    console.log(`\n✅ Total de registros únicos: ${aggregates.size}\n`);
    
    // Deletar registros antigos do PRIO
    const oldDocs = await db.collection('dataWeekly')
      .where('weekId', '==', weekId)
      .where('platform', '==', 'myprio')
      .get();
    
    if (!oldDocs.empty) {
      const batch = db.batch();
      oldDocs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`🗑️  Deletados ${oldDocs.size} registros antigos\n`);
    }
    
    // Salvar novos registros
    console.log('💾 Salvando em dataWeekly...\n');
    
    for (const [key, entry] of aggregates) {
      const doc = {
        id: `${weekId}_myprio_${key}`,
        weekId,
        weekStart: rawData.weekStart,
        weekEnd: rawData.weekEnd,
        platform: 'myprio',
        referenceId: entry.referenceId,
        driverId: null,
        driverName: null,
        vehiclePlate: entry.vehiclePlate,
        totalValue: Number(entry.totalValue.toFixed(2)),
        totalTrips: 0,
        rawDataRef: rawDoc.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (entry.referenceLabel) doc.referenceLabel = entry.referenceLabel;
      
      await db.collection('dataWeekly').doc(doc.id).set(doc);
      console.log(`✅ ${entry.referenceId}: €${doc.totalValue} (placa: ${entry.vehiclePlate || 'N/A'})`);
    }
    
    // Marcar como processado
    await db.collection('rawFileArchive').doc(rawDoc.id).update({
      processed: true,
      processedAt: new Date().toISOString()
    });
    
    console.log('\n✅ PRIO processado com sucesso!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

fixPrio();
