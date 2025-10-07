import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import * as fs from 'fs';
import * as path from 'path';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from 'next-auth/react';
import { RawImportData } from '@/schemas/raw-import-data';
import { getWeekId } from '@/schemas/driver-weekly-record';
import * as XLSX from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';

// Desabilitar o body parser padrão do Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define as colunas obrigatórias para cada tipo de arquivo
const REQUIRED_COLUMNS: { [key: string]: string[] } = {
  uber: ['UUID do motorista', 'Pago a si', 'Viagens', 'Pago a si:Saldo da viagem:Reembolsos:Portagem'],
  bolt: ['Email', 'Ganhos brutos (total)|€', 'Viagens (total)', 'Portagens|€'],
  myprio: ['CARTÃO', 'TOTAL'],
  viaverde: ['OBU', 'Value', 'Entry Date', 'Exit Date'],
};

// Função para validar a estrutura do arquivo
function validateFileStructure(platform: string, headers: string[]): boolean {
  const required = REQUIRED_COLUMNS[platform];
  if (!required) return false; // Plataforma desconhecida
  return required.every(col => headers.includes(col));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session || session.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const form = formidable({
    uploadDir: path.join(process.cwd(), 'tmp'),
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ message: 'Error uploading file' });
    }

    const { platform, weekStart, weekEnd } = fields;
    const uploadedFile = files.file?.[0];

    if (!platform || !weekStart || !weekEnd || !uploadedFile) {
      return res.status(400).json({ message: 'Missing fields or file' });
    }

    const platformStr = Array.isArray(platform) ? platform[0] : platform;
    const weekStartStr = Array.isArray(weekStart) ? weekStart[0] : weekStart;
    const weekEndStr = Array.isArray(weekEnd) ? weekEnd[0] : weekEnd;

    const weekId = getWeekId(new Date(weekStartStr));
    const importId = `${weekId}-${new Date().getTime()}`;

    const filePath = uploadedFile.filepath;
    let headers: string[] = [];
    let rawDataRows: any[] = [];

    try {
      if (uploadedFile.mimetype === 'text/csv') {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
        }
        const records = parseCsv(content, { columns: true, skip_empty_lines: true });
        headers = Object.keys(records[0] || {});
        rawDataRows = records;
      } else if (uploadedFile.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
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
        return res.status(400).json({ message: 'Unsupported file type' });
      }

      // Validar estrutura do arquivo
      if (!validateFileStructure(platformStr, headers)) {
        fs.unlinkSync(filePath); // Remover arquivo temporário
        return res.status(400).json({ message: `Invalid file structure for ${platformStr}. Missing required columns.` });
      }

      // 1. Salvar dados brutos na coleção rawWeeklyData
      const rawDataDocId = `${weekId}-${platformStr}`;
      const rawDataRef = adminDb.collection("rawWeeklyData").doc(rawDataDocId);
      await rawDataRef.set({
        importId: importId,
        weekId: weekId,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        platform: platformStr,
        fileName: uploadedFile.originalFilename || uploadedFile.newFilename,
        data: { headers, rows: rawDataRows },
        createdAt: new Date().toISOString(),
      });

      // 2. Criar/Atualizar entrada em weeklyDataImports com referência
      const importDocRef = adminDb.collection("weeklyDataImports").doc();
      const importEntry: RawImportData = {
        id: importDocRef.id,
        importId: importId,
        weekId: weekId,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        platform: platformStr,
        fileName: uploadedFile.originalFilename || uploadedFile.newFilename,
        filePath: uploadedFile.filepath, // Caminho temporário no servidor
        rawDataRef: rawDataDocId,
        processed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await importDocRef.set(importEntry);

      fs.unlinkSync(filePath); // Remover arquivo temporário após processamento

      return res.status(200).json({ message: 'File uploaded and referenced successfully', importId, platform: platformStr });

    } catch (parseError: any) {
      console.error('Error parsing file:', parseError);
      fs.unlinkSync(filePath); // Remover arquivo temporário
      return res.status(500).json({ message: 'Error processing file', error: parseError.message });
    }
  });
}

