import { importRawData } from "./import_raw_data";
import processHandler from "../pages/api/admin/imports/process";
import { NextApiRequest, NextApiResponse } from 'next';

async function simulateImportAndProcess() {
  const weekStart = "2025-09-29";
  const weekEnd = "2025-10-05";

  const filesToImport = [
    { platform: "uber", filePath: "/home/ubuntu/upload/Uber.csv", type: "csv", fileName: "Uber.csv" },
    { platform: "bolt", filePath: "/home/ubuntu/upload/Bolt.csv", type: "csv", fileName: "Bolt.csv" },
    { platform: "myprio", filePath: "/home/ubuntu/upload/Prio.xlsx", type: "xlsx", fileName: "Prio.xlsx" },
    { platform: "viaverde", filePath: "/home/ubuntu/upload/ViaVerde.xlsx", type: "xlsx", fileName: "ViaVerde.xlsx" },
    // { platform: "cartrack", filePath: "/home/ubuntu/upload/Cartrack.csv", type: "csv", fileName: "Cartrack.csv" }, // Adicionar Cartrack quando o arquivo estiver disponível
  ];

  console.log("Iniciando a importação de dados brutos...");
  const { weekId, rawDataDocIds } = await importRawData(weekStart, weekEnd, filesToImport); // Captura weekId e rawDataDocIds
  console.log("Importação de dados brutos concluída. WeekId gerado:", weekId, "RawDataDocIds:", rawDataDocIds);

  // Simular a chamada da API de processamento
  const req = {
    method: 'POST',
    body: { weekId, rawDataDocIds }, // Passa weekId e rawDataDocIds
    headers: {},
  } as NextApiRequest;

  const res = {
    status: (statusCode: number) => {
      console.log(`API Status: ${statusCode}`);
      return {
        json: (data: any) => {
          console.log('API Response:', data);
        },
      };
    },
  } as NextApiResponse;

  console.log(`Chamando API de processamento para weekId: ${weekId} e rawDataDocIds: ${rawDataDocIds.join(', ')}`);
  await processHandler(req, res);
  console.log("Processamento da API concluído.");
}

simulateImportAndProcess().catch(console.error);

