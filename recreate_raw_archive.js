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

async function recreateRawArchive() {
  try {
    console.log('🔄 Recriando rawFileArchive baseado em dataWeekly\n');
    
    const weekId = '2025-W40';
    const weekStart = '2025-09-29';
    const weekEnd = '2025-10-05';
    
    // Buscar dados de dataWeekly por plataforma
    const dataSnapshot = await db.collection('dataWeekly')
      .where('weekId', '==', weekId)
      .get();
    
    const byPlatform = {
      uber: [],
      bolt: [],
      myprio: [],
      viaverde: []
    };
    
    dataSnapshot.docs.forEach(doc => {
      const data = doc.data();
      byPlatform[data.platform].push(data);
    });
    
    console.log('📊 Dados encontrados em dataWeekly:');
    Object.entries(byPlatform).forEach(([platform, records]) => {
      console.log(`   ${platform}: ${records.length} registros`);
    });
    
    console.log('\n💾 Criando documentos em rawFileArchive...\n');
    
    // Criar rawFileArchive para cada plataforma
    for (const [platform, records] of Object.entries(byPlatform)) {
      if (records.length === 0) continue;
      
      const fileName = platform === 'uber' ? 'Uber.csv' :
                      platform === 'bolt' ? 'Bolt.csv' :
                      platform === 'myprio' ? 'Prio.xlsx' :
                      'ViaVerde.xlsx';
      
      // Criar headers baseado na plataforma
      let headers = [];
      let rows = [];
      
      if (platform === 'uber') {
        headers = ['UUID do motorista', 'Pago a si', 'Viagens', 'Nome do motorista'];
        rows = records.map(r => ({
          'UUID do motorista': r.referenceId,
          'Pago a si': `€${r.totalValue}`,
          'Viagens': r.totalTrips || 0,
          'Nome do motorista': r.referenceLabel || ''
        }));
      } else if (platform === 'bolt') {
        headers = ['Email', 'Ganhos brutos (total)|€', 'Viagens (total)', 'Motorista'];
        rows = records.map(r => ({
          'Email': r.referenceId,
          'Ganhos brutos (total)|€': `€${r.totalValue}`,
          'Viagens (total)': r.totalTrips || 0,
          'Motorista': r.referenceLabel || ''
        }));
      } else if (platform === 'myprio') {
        headers = ['CARTAO', 'DESC CARTAO', 'TOTAL'];
        rows = records.map(r => ({
          'CARTAO': r.referenceId,
          'DESC CARTAO': r.referenceLabel || '.',
          'TOTAL': `${r.totalValue} €`
        }));
      } else if (platform === 'viaverde') {
        headers = ['Matrícula', 'OBU', 'Value'];
        rows = records.map(r => ({
          'Matrícula': r.referenceLabel || r.referenceId,
          'OBU': r.referenceId,
          'Value': `€${r.totalValue}`
        }));
      }
      
      const rawDoc = {
        weekId,
        weekStart,
        weekEnd,
        platform,
        fileName,
        importedAt: new Date().toISOString(),
        importedBy: 'system',
        processed: true,
        processedAt: new Date().toISOString(),
        rawData: {
          headers,
          rows
        }
      };
      
      const docId = `${weekId}-${platform}`;
      await db.collection('rawFileArchive').doc(docId).set(rawDoc);
      
      console.log(`✅ ${platform}: ${fileName} (${rows.length} linhas)`);
    }
    
    console.log('\n✅ rawFileArchive recriado com sucesso!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

recreateRawArchive();
