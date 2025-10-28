export interface RawFileArchiveEntry {
  id?: string; // Opcional para documentos novos
  weekId: string;
  platform: string;
  weekStart: string;
  weekEnd: string;
  fileName?: string; // Nome original do arquivo
  filePath?: string; // Caminho do arquivo no sistema de arquivos (temporário ou de upload)
  rawData: { headers: string[]; rows: any[] }; // Conteúdo bruto do arquivo
  importedAt: string;
  importedBy: string;
  createdAt?: string; // Mantido como opcional se for gerado automaticamente pelo Firestore
  processed: boolean; // Indica se este arquivo bruto já foi processado
  processedAt?: string; // Data de processamento
}


