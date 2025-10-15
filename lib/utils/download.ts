/**
 * Utilitários para download de arquivos
 */

/**
 * Faz download de um arquivo a partir de uma URL ou Blob
 * @param urlOrBlob - URL ou Blob do arquivo
 * @param filename - Nome do arquivo para download
 */
export async function downloadFile(urlOrBlob: string | Blob, filename: string): Promise<void> {
  try {
    let url: string;
    
    if (typeof urlOrBlob === 'string') {
      // Se for URL, fazer fetch
      const response = await fetch(urlOrBlob);
      if (!response.ok) {
        throw new Error(`Erro ao fazer download: ${response.statusText}`);
      }
      const blob = await response.blob();
      url = window.URL.createObjectURL(blob);
    } else {
      // Se já for Blob, criar URL diretamente
      url = window.URL.createObjectURL(urlOrBlob);
    }
    
    // Criar elemento <a> temporário para download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Limpar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    throw error;
  }
}

/**
 * Faz download de um PDF a partir de um endpoint da API
 * @param endpoint - Endpoint da API que retorna o PDF
 * @param filename - Nome do arquivo para download
 */
export async function downloadPDF(endpoint: string, filename: string): Promise<void> {
  try {
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error('Erro ao gerar PDF');
    }
    
    const blob = await response.blob();
    await downloadFile(blob, filename);
  } catch (error) {
    console.error('Erro ao baixar PDF:', error);
    throw error;
  }
}

/**
 * Exporta dados para CSV
 * @param data - Array de objetos para exportar
 * @param filename - Nome do arquivo CSV
 * @param headers - Headers customizados (opcional)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  if (data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }
  
  // Usar headers fornecidos ou extrair do primeiro objeto
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Criar linhas CSV
  const csvRows = [
    csvHeaders.join(','), // Header row
    ...data.map(row =>
      csvHeaders
        .map(header => {
          const value = row[header];
          // Escapar valores que contêm vírgulas ou aspas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })
        .join(',')
    ),
  ];
  
  // Criar Blob e fazer download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Exporta dados para Excel (usando biblioteca externa se disponível)
 * Por enquanto, usa CSV como fallback
 * @param data - Array de objetos para exportar
 * @param filename - Nome do arquivo
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string
): void {
  // TODO: Implementar exportação real para Excel usando biblioteca como 'xlsx'
  // Por enquanto, usar CSV como fallback
  exportToCSV(data, filename.replace('.xlsx', '.csv'));
}

