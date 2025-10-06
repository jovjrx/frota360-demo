import { adminDb } from "@/lib/firebaseAdmin";
import * as fs from "fs";
import * as path from "path";
import { parse as parseCsv } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { getWeekId } from "@/schemas/driver-weekly-record";

interface RawImportData {
  platform: string;
  weekStart: string;
  weekEnd: string;
  rawData: { headers: string[]; rows: any[] };
  processed: boolean;
  processedAt: string | null;
  rawDataSourceRef?: string; // Referência ao documento em rawWeeklyData
  importId: string; // Adicionar importId
}

async function importRawData() {
  const weekStart = "2025-09-29";
  const weekEnd = "2025-10-05";
  const weekId = getWeekId(new Date(weekStart));
  const importId = `${weekId}-${new Date().getTime()}`; // Gerar um importId único para esta importação

  const files = [
    { platform: "uber", filePath: "/home/ubuntu/upload/Uber.csv", type: "csv" },
    { platform: "bolt", filePath: "/home/ubuntu/upload/Bolt.csv", type: "csv" },
    { platform: "myprio", filePath: "/home/ubuntu/upload/Prio.xlsx", type: "xlsx" },
    { platform: "viaverde", filePath: "/home/ubuntu/upload/ViaVerde.xlsx", type: "xlsx" },
  ];

  for (const file of files) {
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

    // 1. Salvar dados brutos na coleção rawWeeklyData
    const rawDataDocId = `${weekId}-${file.platform}`;
    const rawDataRef = adminDb.collection("rawWeeklyData").doc(rawDataDocId);
    await rawDataRef.set({
      weekId,
      platform: file.platform,
      weekStart,
      weekEnd,
      rawData,
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ Dados brutos de ${file.platform} salvos em rawWeeklyData/${rawDataDocId}`);

    // 2. Criar/Atualizar entrada em weeklyDataImports com referência
    const importDocRef = adminDb.collection("weeklyDataImports").doc(); // Novo documento para cada importação
    const importEntry: RawImportData = {
      importId, // Adicionar o importId aqui
      platform: file.platform,
      weekStart,
      weekEnd,
      rawData: { headers: [], rows: [] }, // rawData vazio aqui, pois será buscado via referência
      processed: false,
      processedAt: null,
      rawDataSourceRef: rawDataDocId,
    };
    await importDocRef.set(importEntry);
    console.log(`✅ Entrada de importação para ${file.platform} criada em weeklyDataImports com referência a ${rawDataDocId}`);
  }

  console.log("🎉 Importação de dados brutos concluída!");
}

importRawData();

