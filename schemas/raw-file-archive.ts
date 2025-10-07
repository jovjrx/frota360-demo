export interface RawFileArchiveEntry {
  id?: string; // Opcional para documentos novos
  weekId: string;
  platform: string;
  weekStart: string;
  weekEnd: string;
  fileName?: string; // Nome original do arquivo
  filePath?: string; // Caminho do arquivo no sistema de arquivos (temporário ou de upload)
  rawData: { headers: string[]; rows: any[] }; // Conteúdo bruto do arquivo
  createdAt: string;
  processed: boolean; // Indica se este arquivo bruto já foi processado
  processedAt?: string; // Data de processamento
}

