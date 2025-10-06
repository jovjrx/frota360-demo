import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getFirestore } from 'firebase-admin/firestore';
import formidable from 'formidable';
import fs from 'fs';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Desabilitar bodyParser para permitir formidable processar
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação admin
    const session = await getSession(req, res);
    if (!session?.isLoggedIn) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { files, fields } = await parseForm(req);

    const platform = fields.platform?.[0];
    const weekStart = fields.weekStart?.[0];
    const weekEnd = fields.weekEnd?.[0];

    if (!platform || !weekStart || !weekEnd) {
      return res.status(400).json({ error: 'platform, weekStart e weekEnd são obrigatórios' });
    }

    if (!['uber', 'bolt', 'myprio', 'viaverde'].includes(platform)) {
      return res.status(400).json({ error: 'Plataforma inválida' });
    }

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Ler e parsear o arquivo
    const fileContent = fs.readFileSync(file.filepath);
    const parsedData = await parseFile(file, fileContent, platform);

    // Validar estrutura do arquivo
    validateFileStructure(parsedData.columns, platform);

    // Criar importId único para este batch
    const importId = `import_${Date.now()}`;

    // Salvar no Firestore
    const db = getFirestore();
    const importRef = db.collection('weeklyDataImports').doc();

    const importData = {
      id: importRef.id,
      importId,
      platform,
      source: 'manual',
      weekStart,
      weekEnd,
      rawData: parsedData,
      processed: false,
      uploadedBy: session.userId || 'unknown',
      uploadedAt: new Date().toISOString(),
    };

    await importRef.set(importData);

    return res.status(200).json({
      success: true,
      importId,
      recordsCount: parsedData.rows.length,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
}

/**
 * Parse form com formidable
 */
function parseForm(req: NextApiRequest): Promise<{
  files: formidable.Files;
  fields: formidable.Fields;
}> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

/**
 * Parse arquivo CSV ou Excel
 */
async function parseFile(
  file: formidable.File,
  content: Buffer,
  platform: string
): Promise<{
  filename: string;
  rows: any[];
  columns: string[];
}> {
  const filename = file.originalFilename || 'unknown';
  
  // Detectar tipo de arquivo
  if (filename.endsWith('.csv')) {
    return parseCSV(content, filename);
  } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    return parseExcel(content, filename);
  } else {
    throw new Error('Formato de arquivo não suportado. Use CSV ou Excel.');
  }
}

/**
 * Parse CSV com Papa Parse
 */
function parseCSV(content: Buffer, filename: string): {
  filename: string;
  rows: any[];
  columns: string[];
} {
  const text = content.toString('utf-8');
  
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // Manter tudo como string inicialmente
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  return {
    filename,
    rows: result.data,
    columns: result.meta.fields || [],
  };
}

/**
 * Parse Excel com xlsx
 */
function parseExcel(content: Buffer, filename: string): {
  filename: string;
  rows: any[];
  columns: string[];
} {
  const workbook = XLSX.read(content, { type: 'buffer' });
  
  // Usar a primeira aba
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Converter para JSON
  const data = XLSX.utils.sheet_to_json(worksheet);

  // Extrair colunas da primeira linha
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return {
    filename,
    rows: data,
    columns,
  };
}


/**
 * Valida a estrutura do arquivo com base na plataforma.
 */
function validateFileStructure(columns: string[], platform: string) {
  let requiredColumns: string[] = [];

  switch (platform) {
    case 'uber':
      requiredColumns = ['UUID do motorista', 'Pago a si'];
      break;
    case 'bolt':
      requiredColumns = ['Email', 'Ganhos brutos (total)|€'];
      break;
    case 'myprio':
      requiredColumns = ['CARTÃO', 'TOTAL'];
      break;
    case 'viaverde':
      requiredColumns = ['OBU', 'Value', 'Entry Date', 'Exit Date'];
      break;
    default:
      throw new Error(`Plataforma desconhecida: ${platform}`);
  }

  const missingColumns = requiredColumns.filter(col => !columns.includes(col));

  if (missingColumns.length > 0) {
    throw new Error(`Colunas obrigatórias ausentes para ${platform}: ${missingColumns.join(', ')}`);
  }
}
