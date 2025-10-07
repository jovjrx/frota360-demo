import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb as db } from '@/lib/firebaseAdmin';
import formidable from 'formidable';
import fs from 'fs';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/admin/weekly/import-raw
 * Importa dados brutos para as 4 collections (raw_uber, raw_bolt, raw_prio, raw_viaverde)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = formidable({ multiples: true });
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const weekStart = Array.isArray(fields.weekStart) ? fields.weekStart[0] : fields.weekStart;
    const weekEnd = Array.isArray(fields.weekEnd) ? fields.weekEnd[0] : fields.weekEnd;
    const adminId = Array.isArray(fields.adminId) ? fields.adminId[0] : fields.adminId || 'system';
    
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart e weekEnd são obrigatórios' });
    }

    const importId = randomUUID();
    const importedAt = new Date().toISOString();

    const results = {
      success: [] as string[],
      errors: [] as Array<{ platform: string; error: string }>,
      importId,
    };

    // ============================================================================
    // PROCESSAR UBER
    // ============================================================================
    if (files.uber) {
      try {
        const uberFile = Array.isArray(files.uber) ? files.uber[0] : files.uber;
        const content = fs.readFileSync(uberFile.filepath, 'utf-8');
        const parsed = Papa.parse(content, { header: true });
        
        let count = 0;
        const batch = db.batch();
        
        parsed.data.forEach((row: any) => {
          const uuid = row['UUID do motorista'] || row['Driver UUID'];
          if (!uuid) return;
          
          const docId = `${importId}_${uuid}`;
          const docRef = db.collection('raw_uber').doc(docId);
          
          batch.set(docRef, {
            id: docId,
            importId,
            weekStart,
            weekEnd,
            driverUuid: uuid,
            driverFirstName: row['Nome próprio do motorista'] || row['Driver First Name'] || '',
            driverLastName: row['Apelido do motorista'] || row['Driver Last Name'] || '',
            paidToYou: parseFloat(row['Pago a si'] || row['Paid to you'] || '0'),
            yourEarnings: parseFloat(row['Pago a si : Os seus rendimentos'] || row['Your Earnings'] || '0'),
            tripBalance: parseFloat(row['Pago a si : Saldo da viagem'] || row['Trip Balance'] || '0'),
            cashCollected: parseFloat(row['Pago a si : Saldo da viagem : Pagamentos : Dinheiro recebido'] || row['Cash Collected'] || '0'),
            fare: parseFloat(row['Pago a si : Os seus rendimentos : Tarifa'] || row['Fare'] || '0'),
            taxes: parseFloat(row['Pago a si : Os seus rendimentos : Impostos'] || row['Taxes'] || '0'),
            serviceFee: parseFloat(row['Pago a si:Os seus rendimentos:Taxa de serviço'] || row['Service Fee'] || '0'),
            tip: parseFloat(row['Pago a si:Os seus rendimentos:Gratificação'] || row['Tip'] || '0'),
            tolls: parseFloat(row['Pago a si:Saldo da viagem:Reembolsos:Portagem'] || row['Tolls'] || '0'),
            importedAt,
            importedBy: adminId,
            fileName: uberFile.originalFilename || 'uber.csv',
            source: 'manual',
            rawData: row,
          });
          
          count++;
        });
        
        await batch.commit();
        results.success.push(`Uber: ${count} registros importados`);
      } catch (error: any) {
        results.errors.push({ platform: 'Uber', error: error.message });
      }
    }

    // ============================================================================
    // PROCESSAR BOLT
    // ============================================================================
    if (files.bolt) {
      try {
        const boltFile = Array.isArray(files.bolt) ? files.bolt[0] : files.bolt;
        const content = fs.readFileSync(boltFile.filepath, 'utf-8');
        const parsed = Papa.parse(content, { header: true });
        
        let count = 0;
        const batch = db.batch();
        
        parsed.data.forEach((row: any) => {
          const email = row['Email'] || row['Driver Email'];
          if (!email) return;
          
          const docId = `${importId}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const docRef = db.collection('raw_bolt').doc(docId);
          
          batch.set(docRef, {
            id: docId,
            importId,
            weekStart,
            weekEnd,
            driverName: row['Motorista'] || row['Driver'] || '',
            driverEmail: email,
            driverPhone: row['Telemóvel'] || row['Phone'] || '',
            driverId: row['Identificador do motorista'] || row['Driver ID'] || '',
            grossEarningsTotal: parseFloat(row['Ganhos brutos (total)|€'] || row['Gross earnings (total)'] || '0'),
            grossEarningsApp: parseFloat(row['Ganhos brutos (pagamentos na app)|€'] || row['Gross earnings (app)'] || '0'),
            grossEarningsCash: parseFloat(row['Ganhos brutos (pagamentos em dinheiro)|€'] || row['Gross earnings (cash)'] || '0'),
            cashCollected: parseFloat(row['Dinheiro recebido|€'] || row['Cash collected'] || '0'),
            tips: parseFloat(row['Gorjetas dos passageiros|€'] || row['Tips'] || '0'),
            campaignEarnings: parseFloat(row['Ganhos da campanha|€'] || row['Campaign earnings'] || '0'),
            expenseReimbursements: parseFloat(row['Reembolsos de despesas|€'] || row['Expense reimbursements'] || '0'),
            cancellationFees: parseFloat(row['Taxas de cancelamento|€'] || row['Cancellation fees'] || '0'),
            tolls: parseFloat(row['Portagens|€'] || row['Tolls'] || '0'),
            bookingFees: parseFloat(row['Taxas de reserva|€'] || row['Booking fees'] || '0'),
            totalFees: parseFloat(row['Total de taxas|€'] || row['Total fees'] || '0'),
            commissions: parseFloat(row['Comissões|€'] || row['Commissions'] || '0'),
            passengerRefunds: parseFloat(row['Reembolsos aos passageiros|€'] || row['Passenger refunds'] || '0'),
            otherFees: parseFloat(row['Outras taxas|€'] || row['Other fees'] || '0'),
            netEarnings: parseFloat(row['Ganhos líquidos|€'] || row['Net earnings'] || '0'),
            expectedPayment: parseFloat(row['Pagamento previsto|€'] || row['Expected payment'] || '0'),
            grossEarningsPerHour: parseFloat(row['Ganhos brutos por hora|€/h'] || row['Gross earnings per hour'] || '0'),
            netEarningsPerHour: parseFloat(row['Ganhos líquidos por hora|€/h'] || row['Net earnings per hour'] || '0'),
            importedAt,
            importedBy: adminId,
            fileName: boltFile.originalFilename || 'bolt.csv',
            source: 'manual',
            rawData: row,
          });
          
          count++;
        });
        
        await batch.commit();
        results.success.push(`Bolt: ${count} registros importados`);
      } catch (error: any) {
        results.errors.push({ platform: 'Bolt', error: error.message });
      }
    }

    // ============================================================================
    // PROCESSAR PRIO
    // ============================================================================
    if (files.prio) {
      try {
        const prioFile = Array.isArray(files.prio) ? files.prio[0] : files.prio;
        const workbook = XLSX.readFile(prioFile.filepath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Pular linhas vazias e encontrar cabeçalho
        let headerRow: any[] = [];
        let dataStartIndex = 0;
        
        for (let i = 0; i < data.length; i++) {
          const row = data[i] as any[];
          if (row.includes('POSTO') || row.includes('CARTÃO')) {
            headerRow = row;
            dataStartIndex = i + 1;
            break;
          }
        }
        
        if (!headerRow.length) {
          throw new Error('Cabeçalho não encontrado no arquivo Prio');
        }
        
        let count = 0;
        const batch = db.batch();
        
        for (let i = dataStartIndex; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0) continue;
          
          const rowObj: any = {};
          headerRow.forEach((header, index) => {
            rowObj[header] = row[index];
          });
          
          const cardNumber = String(rowObj['CARTÃO'] || rowObj['Card Number'] || '');
          const transactionDate = rowObj['DATA'] || rowObj['Date'];
          
          if (!cardNumber || !transactionDate) continue;
          
          const docId = `${importId}_${cardNumber}_${i}`;
          const docRef = db.collection('raw_prio').doc(docId);
          
          batch.set(docRef, {
            id: docId,
            importId,
            weekStart,
            weekEnd,
            cardNumber,
            cardDescription: rowObj['DESC. CARTÃO'] || rowObj['Card Description'] || '',
            cardStatus: rowObj['ESTADO'] || rowObj['Status'] || '',
            cardGroup: rowObj['GRUPO CARTÃO'] || rowObj['Card Group'] || '',
            driverId: rowObj['ID CONDUTOR'] || rowObj['Driver ID'] || '',
            transactionDate: typeof transactionDate === 'number' 
              ? new Date((transactionDate - 25569) * 86400 * 1000).toISOString().split('T')[0]
              : transactionDate,
            transactionTime: rowObj['HORA'] || rowObj['Time'] || '',
            station: rowObj['POSTO'] || rowObj['Station'] || '',
            country: rowObj['PAÍS'] || rowObj['Country'] || '',
            network: rowObj['REDE'] || rowObj['Network'] || '',
            fuelType: rowObj['COMBUSTÍVEL'] || rowObj['Fuel Type'] || '',
            liters: parseFloat(rowObj['LITROS'] || rowObj['Liters'] || '0'),
            unitPrice: parseFloat(rowObj['VAL. UNIT.(S/IVA)'] || rowObj['Unit Price'] || '0'),
            netValue: parseFloat(rowObj['VALOR LÍQUIDO'] || rowObj['Net Value'] || '0'),
            vat: parseFloat(rowObj['IVA'] || rowObj['VAT'] || '0'),
            totalValue: parseFloat(rowObj['TOTAL'] || rowObj['Total'] || '0'),
            referenceValue: parseFloat(rowObj['VALOR REF(C/IVA)'] || rowObj['Reference Value'] || '0'),
            discountValue: parseFloat(rowObj['VALOR DESC.(C/IVA)'] || rowObj['Discount Value'] || '0'),
            receiptNumber: rowObj['RECIBO'] || rowObj['Receipt'] || '',
            invoiceNumber: rowObj['FATURA'] || rowObj['Invoice'] || '',
            invoiceDate: rowObj['DATA FATURA'] || rowObj['Invoice Date'] || '',
            kilometers: parseFloat(rowObj["KM'S"] || rowObj['Kilometers'] || '0'),
            client: rowObj['CLIENTE'] || rowObj['Client'] || '',
            paymentType: rowObj['TIPO DE PAGAMENTO'] || rowObj['Payment Type'] || '',
            importedAt,
            importedBy: adminId,
            fileName: prioFile.originalFilename || 'prio.xlsx',
            source: 'manual',
            rawData: rowObj,
          });
          
          count++;
        }
        
        await batch.commit();
        results.success.push(`Prio: ${count} transações importadas`);
      } catch (error: any) {
        results.errors.push({ platform: 'Prio', error: error.message });
      }
    }

    // ============================================================================
    // PROCESSAR VIAVERDE
    // ============================================================================
    if (files.viaverde) {
      try {
        const viaverdeFile = Array.isArray(files.viaverde) ? files.viaverde[0] : files.viaverde;
        const workbook = XLSX.readFile(viaverdeFile.filepath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        let count = 0;
        const batch = db.batch();
        
        data.forEach((row: any, index: number) => {
          const licensePlate = row['License Plate'] || row['Matrícula'];
          const entryDate = row['Entry Date'] || row['Data Entrada'];
          
          if (!licensePlate || !entryDate) return;
          
          const docId = `${importId}_${licensePlate}_${index}`;
          const docRef = db.collection('raw_viaverde').doc(docId);
          
          batch.set(docRef, {
            id: docId,
            importId,
            weekStart,
            weekEnd,
            licensePlate,
            iai: row['IAI'] || '',
            obu: row['OBU'] || '',
            contractNumber: row['Contract Number'] || row['Número Contrato'] || '',
            entryDate: row['Entry Date'] || row['Data Entrada'] || '',
            exitDate: row['Exit Date'] || row['Data Saída'] || '',
            entryPoint: row['Entry Point'] || row['Ponto Entrada'] || '',
            exitPoint: row['Exit Point'] || row['Ponto Saída'] || '',
            service: row['Service'] || row['Serviço'] || '',
            serviceDescription: row['Service Description'] || row['Descrição Serviço'] || '',
            market: row['Market'] || row['Mercado'] || '',
            marketDescription: row['Market Description'] || row['Descrição Mercado'] || '',
            value: parseFloat(row['Value'] || row['Valor'] || '0'),
            discountVV: parseFloat(row['Discount VV'] || row['Desconto VV'] || '0'),
            discountVVPercentage: parseFloat(row['Discount VVPercentage'] || row['% Desconto VV'] || '0'),
            liquidValue: parseFloat(row['Liquid Value'] || row['Valor Líquido'] || '0'),
            discountBalance: parseFloat(row['Discount Balance'] || row['Saldo Desconto'] || '0'),
            mobilityAccount: row['Mobility Account'] || row['Conta Mobilidade'] || '',
            isPayed: row['Is Payed'] === 'True' || row['Is Payed'] === true || row['Pago'] === 'Sim',
            paymentDate: row['Payment Date'] || row['Data Pagamento'] || '',
            paymentMethod: row['Payment Method'] || row['Método Pagamento'] || '',
            systemEntryDate: row['System Entry Date'] || row['Data Sistema'] || '',
            importedAt,
            importedBy: adminId,
            fileName: viaverdeFile.originalFilename || 'viaverde.xlsx',
            source: 'manual',
            rawData: row,
          });
          
          count++;
        });
        
        await batch.commit();
        results.success.push(`ViaVerde: ${count} transações importadas`);
      } catch (error: any) {
        results.errors.push({ platform: 'ViaVerde', error: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      results,
      importId,
      weekStart,
      weekEnd,
    });
  } catch (error: any) {
    console.error('Erro ao processar importação:', error);
    return res.status(500).json({ error: error.message });
  }
}
