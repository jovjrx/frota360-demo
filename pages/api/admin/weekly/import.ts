import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb as db } from '@/lib/firebaseAdmin';
import formidable from 'formidable';
import fs from 'fs';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { getWeekDates } from "@/lib/utils/date-helpers";
import { updateDataSource, createWeeklyDataSources, WeeklyDataSources } from '@/schemas/weekly-data-sources';
import { RawFileArchiveEntry } from '@/schemas/raw-file-archive';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ProcessedData {
  uber: Map<string, number>;
  bolt: Map<string, number>;
  myprio: Map<string, number>;
  viaverde: Map<string, number>;
}

/**
 * POST /api/admin/weekly/import
 * Processa importação de arquivos semanais
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

    const weekId = Array.isArray(fields.weekId) ? fields.weekId[0] : fields.weekId;
    
    if (!weekId) {
      return res.status(400).json({ error: 'weekId é obrigatório' });
    }

    const { start, end } = getWeekDates(weekId);

    // Buscar todos os motoristas
    const driversSnapshot = await db.collection('drivers').where('status', '==', 'active').get();
    const drivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    // Processar arquivos
    const processedData: ProcessedData = {
      uber: new Map(),
      bolt: new Map(),
      myprio: new Map(),
      viaverde: new Map(),
    };

    const adminId = 'admin_user_id'; // TODO: Obter o ID do admin logado
    const importedAt = new Date().toISOString();

    const results = {
      success: [] as string[],
      errors: [] as Array<{ platform: string; error: string }>,
      warnings: [] as string[],
    };

    const processAndArchiveFile = async (platform: 'uber' | 'bolt' | 'myprio' | 'viaverde' | 'cartrack', file: formidable.File | undefined) => {
      if (!file) return;

      const filePath = file.filepath;
      let headers: string[] = [];
      let rawDataRows: any[] = [];

      try {
        if (file.mimetype === 'text/csv') {
          let content = fs.readFileSync(filePath, 'utf8');
          if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
          }
          const records = Papa.parse(content, { header: true }).data;
          headers = Object.keys(records[0] || {});
          rawDataRows = records;
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          const workbook = XLSX.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          headers = json[0] as string[];
          rawDataRows = json.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
        } else {
          fs.unlinkSync(filePath); // Remover arquivo temporário
          throw new Error('Unsupported file type');
        }

        // Salvar dados brutos na coleção rawFileArchive
        const rawDataDocId = `${weekId}-${platform}`;
        const rawDataRef = db.collection("rawFileArchive").doc(rawDataDocId);
        const rawFileEntry: RawFileArchiveEntry = {
          id: rawDataDocId,
          weekId: weekId,
          weekStart: start,
          weekEnd: end,
          platform: platform,
          fileName: file.originalFilename || file.newFilename,
          rawData: { headers, rows: rawDataRows },
          importedAt: importedAt,
          importedBy: adminId,
          processed: false,
        };
        await rawDataRef.set(rawFileEntry);

        fs.unlinkSync(filePath); // Remover arquivo temporário após processamento
        results.success.push(`${platform}: Arquivo importado e arquivado com sucesso.`);
        const currentWeeklyDataSources = (await db.collection("weeklyDataSources").doc(weekId).get()).data() as WeeklyDataSources;
        await db.collection("weeklyDataSources").doc(weekId).set(updateDataSource(currentWeeklyDataSources, platform as any, { status: 'complete', origin: 'manual', importedAt: importedAt, archiveRef: rawDataDocId }), { merge: true });
      } catch (error: any) {
        console.error(`Error processing ${platform} file:`, error);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Remover arquivo temporário em caso de erro
        }
        results.errors.push({ platform: platform, error: error.message });
        const currentWeeklyDataSources = (await db.collection("weeklyDataSources").doc(weekId).get()).data() as WeeklyDataSources;
        await db.collection("weeklyDataSources").doc(weekId).set(updateDataSource(currentWeeklyDataSources, platform as any, { status: 'partial', origin: 'manual', lastError: error.message }), { merge: true });
      }
    };

    await processAndArchiveFile('uber', files.uber?.[0]);
    await processAndArchiveFile('bolt', files.bolt?.[0]);
    await processAndArchiveFile('myprio', files.myprio?.[0]);
    await processAndArchiveFile('viaverde', files.viaverde?.[0]);

    // Criar ou atualizar o registro WeeklyDataSources
    const weeklyDataSourceRef = db.collection('weeklyDataSources').doc(weekId);
    const weeklyDataSourceDoc = await weeklyDataSourceRef.get();

    if (!weeklyDataSourceDoc.exists) {
      const newDataSource = createWeeklyDataSources(weekId, start, end);
      await weeklyDataSourceRef.set(newDataSource);
    }

    return res.status(200).json({
      success: true,
      results,
      weekId,
    });
  } catch (error: any) {
    console.error('Erro ao processar importação:', error);
    return res.status(500).json({ error: error.message });
  }
}
