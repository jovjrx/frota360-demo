import { adminDb } from "@/lib/firebaseAdmin";
import * as fs from "fs";
import * as path from "path";
import { parse as parseCsv } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { getWeekId } from "@/schemas/driver-weekly-record";
import { RawFileArchiveEntry } from "@/schemas/raw-file-archive";

async function importRawData(weekStart: string, weekEnd: string, filesToImport: { platform: string; filePath: string; type: string; fileName: string }[]) {
  const weekId = getWeekId(new Date(weekStart));
  const importId = `${weekId}-${new Date().getTime()}`; // Gerar um importId único para esta importação
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
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      rawData.headers = json[0] as string[];
      rawData.rows = json.slice(1).map(row => {
        const obj: any = {};
        rawData.headers.forEach((header, index) => {
          obj[header] = row[index];
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
      createdAt: new Date().toISOString(),
      processed: false,
    };
    await rawDataRef.set(entry);
    console.log(`✅ Dados brutos de ${file.platform} salvos em rawFileArchive/${rawDataDocId}`);
    rawDataDocIds.push(rawDataDocId);
  }

  console.log("🎉 Importação de dados brutos concluída!");
  return { importId, weekId, rawDataDocIds };
}

export { importRawData };

