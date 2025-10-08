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

function extractFirstAvailable(row, keys) {
  if (!row) return undefined;
  for (const key of keys) {
    if (key in row && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  return undefined;
}

function createEntry(weekId, platform, data, rawDocId) {
  const entry = {
    id: data.id,
    weekId,
    weekStart: data.weekStart,
    weekEnd: data.weekEnd,
    platform,
    referenceId: data.referenceId,
    driverId: null,
    driverName: null,
    vehiclePlate: null,
    totalValue: Number(data.totalValue.toFixed(2)),
    totalTrips: data.totalTrips || 0,
    rawDataRef: rawDocId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Adicionar campos opcionais apenas se existirem
  if (data.referenceLabel) entry.referenceLabel = data.referenceLabel;
  if (data.vehiclePlate) entry.vehiclePlate = data.vehiclePlate;
  
  return entry;
}

async function processRawData() {
  try {
    console.log('🔄 PROCESSAMENTO DE DADOS\n');
    console.log('='.repeat(60));
    
    const weekId = '2025-W40';
    
    // Buscar dados brutos
    console.log('\n📦 Buscando dados brutos...\n');
    const rawSnapshot = await db.collection('rawFileArchive')
      .where('weekId', '==', weekId)
      .get();
    
    if (rawSnapshot.empty) {
      console.log('❌ Nenhum dado encontrado');
      return;
    }
    
    console.log(`✅ Encontrados ${rawSnapshot.size} arquivos\n`);
    
    let totalProcessed = 0;
    
    for (const rawDoc of rawSnapshot.docs) {
      const rawData = rawDoc.data();
      const platform = rawData.platform;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 ${platform.toUpperCase()}`);
      console.log(`Arquivo: ${rawData.fileName}`);
      console.log(`Linhas: ${rawData.rawData.rows.length}`);
      
      const entries = [];
      
      if (platform === 'uber') {
        const aggregates = new Map();
        rawData.rawData.rows.forEach(row => {
          const uuid = extractFirstAvailable(row, ['UUID do motorista', 'UUID', 'Driver UUID']);
          const amount = extractFirstAvailable(row, ['Pago a si', 'Paid to you']);
          const trips = extractFirstAvailable(row, ['Viagens', 'Trips']);
          const name = extractFirstAvailable(row, ['Nome do motorista', 'Driver name']);
          
          if (!uuid) return;
          
          const key = normalizeKey(uuid);
          const entry = aggregates.get(key) || {
            referenceId: String(uuid).trim(),
            referenceLabel: name ? String(name).trim() : null,
            totalValue: 0,
            totalTrips: 0
          };
          
          entry.totalValue += parseNumber(amount);
          entry.totalTrips += parseInt(trips) || 0;
          aggregates.set(key, entry);
        });
        
        aggregates.forEach(entry => {
          entries.push(createEntry(weekId, 'uber', {
            id: `${weekId}_uber_${normalizeKey(entry.referenceId)}`,
            weekStart: rawData.weekStart,
            weekEnd: rawData.weekEnd,
            referenceId: entry.referenceId,
            referenceLabel: entry.referenceLabel,
            totalValue: entry.totalValue,
            totalTrips: entry.totalTrips
          }, rawDoc.id));
        });
      }
      
      else if (platform === 'bolt') {
        const aggregates = new Map();
        rawData.rawData.rows.forEach(row => {
          const email = extractFirstAvailable(row, ['Email', 'Driver email']);
          const amount = extractFirstAvailable(row, ['Ganhos brutos (total)|€', 'Ganhos brutos (total)', 'Total Earnings']);
          const trips = extractFirstAvailable(row, ['Viagens (total)', 'Viagens', 'Trips']);
          const name = extractFirstAvailable(row, ['Motorista', 'Driver']);
          
          if (!email) return;
          
          const key = normalizeKey(email);
          const entry = aggregates.get(key) || {
            referenceId: String(email).trim(),
            referenceLabel: name ? String(name).trim() : null,
            totalValue: 0,
            totalTrips: 0
          };
          
          entry.totalValue += parseNumber(amount);
          entry.totalTrips += parseInt(trips) || 0;
          aggregates.set(key, entry);
        });
        
        aggregates.forEach(entry => {
          entries.push(createEntry(weekId, 'bolt', {
            id: `${weekId}_bolt_${normalizeKey(entry.referenceId)}`,
            weekStart: rawData.weekStart,
            weekEnd: rawData.weekEnd,
            referenceId: entry.referenceId,
            referenceLabel: entry.referenceLabel,
            totalValue: entry.totalValue,
            totalTrips: entry.totalTrips
          }, rawDoc.id));
        });
      }
      
      else if (platform === 'myprio') {
        const aggregates = new Map();
        rawData.rawData.rows.forEach(row => {
          const card = extractFirstAvailable(row, ['CARTÃO', 'Cartão', 'Card']);
          const plate = extractFirstAvailable(row, ['Matrícula', 'MATRICULA', 'License plate']);
          const amount = extractFirstAvailable(row, ['TOTAL', 'Total', 'Valor Total']);
          
          const identifier = card || plate;
          if (!identifier) return;
          
          const key = normalizeKey(identifier);
          const entry = aggregates.get(key) || {
            referenceId: String(card || plate).trim(),
            referenceLabel: plate ? String(plate).trim() : null,
            vehiclePlate: plate ? String(plate).trim() : null,
            totalValue: 0
          };
          
          entry.totalValue += parseNumber(amount);
          aggregates.set(key, entry);
        });
        
        aggregates.forEach(entry => {
          entries.push(createEntry(weekId, 'myprio', {
            id: `${weekId}_myprio_${normalizeKey(entry.referenceId)}`,
            weekStart: rawData.weekStart,
            weekEnd: rawData.weekEnd,
            referenceId: entry.referenceId,
            referenceLabel: entry.referenceLabel,
            vehiclePlate: entry.vehiclePlate,
            totalValue: entry.totalValue,
            totalTrips: 0
          }, rawDoc.id));
        });
      }
      
      else if (platform === 'viaverde') {
        const aggregates = new Map();
        rawData.rawData.rows.forEach(row => {
          const plate = extractFirstAvailable(row, ['Matrícula', 'MATRICULA', 'License Plate']);
          const tag = extractFirstAvailable(row, ['OBU', 'Tag']);
          const amount = extractFirstAvailable(row, ['Value', 'Valor', 'TOTAL']);
          
          const identifier = plate || tag;
          if (!identifier) return;
          
          const key = normalizePlate(plate) || normalizeKey(tag);
          const entry = aggregates.get(key) || {
            referenceId: String(plate || tag).trim(),
            referenceLabel: plate ? String(plate).trim() : null,
            vehiclePlate: plate ? String(plate).trim() : null,
            totalValue: 0
          };
          
          entry.totalValue += parseNumber(amount);
          aggregates.set(key, entry);
        });
        
        aggregates.forEach(entry => {
          entries.push(createEntry(weekId, 'viaverde', {
            id: `${weekId}_viaverde_${normalizePlate(entry.referenceLabel || entry.referenceId)}`,
            weekStart: rawData.weekStart,
            weekEnd: rawData.weekEnd,
            referenceId: entry.referenceId,
            referenceLabel: entry.referenceLabel,
            vehiclePlate: entry.vehiclePlate,
            totalValue: entry.totalValue,
            totalTrips: 0
          }, rawDoc.id));
        });
      }
      
      console.log(`\n✅ Processados ${entries.length} registros únicos`);
      
      if (entries.length > 0) {
        console.log(`💾 Salvando em dataWeekly...`);
        
        // Deletar registros antigos desta plataforma
        const oldDocs = await db.collection('dataWeekly')
          .where('weekId', '==', weekId)
          .where('platform', '==', platform)
          .get();
        
        if (!oldDocs.empty) {
          const batch = db.batch();
          oldDocs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          console.log(`   🗑️  Deletados ${oldDocs.size} registros antigos`);
        }
        
        // Salvar novos registros
        for (const entry of entries) {
          await db.collection('dataWeekly').doc(entry.id).set(entry);
          console.log(`   ✅ ${entry.referenceId}: €${entry.totalValue} (${entry.totalTrips} viagens)`);
        }
        
        totalProcessed += entries.length;
      }
      
      // Marcar como processado
      await db.collection('rawFileArchive').doc(rawDoc.id).update({
        processed: true,
        processedAt: new Date().toISOString()
      });
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`\n✅ CONCLUÍDO! Total: ${totalProcessed} registros processados\n`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

processRawData();
