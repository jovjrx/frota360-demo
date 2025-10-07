import { adminDb } from "@/lib/firebaseAdmin";
import * as fs from "fs";
import * as path from "path";
import { parse as parseCsv } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { getWeekId } from "@/lib/utils/date-helpers";
import { RawFileArchiveEntry } from "@/schemas/raw-file-archive";

// Função auxiliar para normalizar strings (remover acentos e caracteres especiais)
function normalizeString(str: string): string {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-zA-Z0-9_\s]/g, "").trim();
}

async function importRawData(weekStart: string, weekEnd: string, filesToImport: { platform: string; filePath: string; type: string; fileName: string }[]) {
  const weekId = getWeekId(new Date(weekStart));
  const rawDataDocIds: string[] = [];

  for (const file of filesToImport) {
    console.log(`Processando arquivo: ${file.filePath} para a plataforma ${file.platform}`);
    let rawData: { headers: string[]; rows: any[] } = { headers: [], rows: [] };

    if (file.type === "csv") {
      let content = fs.readFileSync(file.filePath, "utf8");
      // Remover BOM se existir
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      const records = parseCsv(content, { columns: true, skip_empty_lines: true });
      rawData.headers = Object.keys(records[0] || {});
      rawData.rows = records;
    } else if (file.type === "xlsx") {
      const workbook = XLSX.readFile(file.filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][];

      let headerRowIndex = 0; // Assume a primeira linha como cabeçalho por padrão

      // Lógica específica para Prio: encontrar a linha do cabeçalho que contém 'POSTO'
      if (file.platform === 'myprio') {
        let foundHeader = false;
        for (let i = 0; i < sheetData.length; i++) {
          const row = sheetData[i];
          if (row.some(cell => typeof cell === 'string' && normalizeString(cell).toUpperCase() === 'POSTO')) {
            headerRowIndex = i;
            foundHeader = true;
            break;
          }
        }
        if (!foundHeader) {
          console.error(`❌ Cabeçalho 'POSTO' não encontrado no arquivo ${file.fileName} para a plataforma ${file.platform}.`);
          continue; // Pular este arquivo se o cabeçalho não for encontrado
        }
      }

      const headers = sheetData[headerRowIndex].map(cell => normalizeString(String(cell)));
      const rows = sheetData.slice(headerRowIndex + 1).filter(row => row.some(cell => cell !== null && String(cell).trim() !== '')); // Filtrar linhas vazias

      rawData.headers = headers;
      rawData.rows = rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] === undefined ? null : row[index];
        });
        return obj;
      });
    }

    // Salvar dados brutos na coleção rawFileArchive
    const rawDataDocId = `${weekId}-${file.platform}`;
    const rawDataRef = adminDb.collection("rawFileArchive").doc(rawDataDocId);
    const entry: RawFileArchiveEntry = {
      weekId,
      platform: file.platform,
      weekStart,
      weekEnd,
      fileName: file.fileName,
      filePath: file.filePath, // Manter para rastreabilidade, embora o conteúdo esteja em rawData
      rawData,
      importedAt: new Date().toISOString(),
      importedBy: 'system',
      createdAt: new Date().toISOString(),
      processed: false,
    };
    await rawDataRef.set(entry);
    console.log(`✅ Dados brutos de ${file.platform} salvos em rawFileArchive/${rawDataDocId}`);
    rawDataDocIds.push(rawDataDocId);
  }

  console.log("🎉 Importação de dados brutos concluída!");
  return { weekId, rawDataDocIds };
}

export { importRawData };

