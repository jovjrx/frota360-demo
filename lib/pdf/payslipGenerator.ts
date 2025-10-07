import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import path from 'path';

export interface PayslipData {
  // Dados do motorista
  driverName: string;
  driverType: 'affiliate' | 'renter';
  vehiclePlate?: string;
  weekStart: string; // DD/MM/YYYY
  weekEnd: string; // DD/MM/YYYY
  
  // Receitas
  uberTotal: number;
  boltTotal: number;
  ganhosTotal: number;
  
  // IVA e Comissão
  ivaValor: number;
  ganhosMenosIva: number;
  comissao: number;
  
  // Descontos
  combustivel: number;
  viaverde: number;
  aluguel: number;
  
  // Repasse
  repasse: number;
  
  // Dados bancários
  iban: string;
  status: 'paid' | 'pending' | 'cancelled';
}

/**
 * Gera PDF de contracheque
 */
export async function generatePayslipPDF(data: PayslipData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 50, bottom: 50, left: 50, right: 50 } 
      });
      
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ============================================================================
      // HEADER COM LOGO
      // ============================================================================
      
      // Logo CONDUZ (centralizada)
      const logoPath = path.join(process.cwd(), 'public', 'img', 'logo.png');
      try {
        // Centralizar: (595 - 180) / 2 = 207.5
        doc.image(logoPath, 207.5, 30, { width: 180 });
      } catch (e) {
        // Se logo não existir, usar texto
        doc.fontSize(24).fillColor('#48BB78').text('CONDUZ', { align: 'center' });
      }
      
      doc.moveDown(3);
      
      // Alvorada Magistral LDA
      doc.fontSize(10).fillColor('#666666')
        .text('Alvorada Magistral LDA', { align: 'center' });
      
      // Website
      doc.fontSize(9).fillColor('#4472C4')
        .text('conduz.pt', { align: 'center' });
      
      doc.moveDown(2);
      
      // ============================================================================
      // TÍTULO
      // ============================================================================
      
      doc.fontSize(14).fillColor('#000000').font('Helvetica-Bold')
        .text('RESUMO SEMANAL', { align: 'center' });
      
      doc.moveDown(1.5);
      
      // ============================================================================
      // DADOS DO MOTORISTA
      // ============================================================================
      
      doc.fontSize(11).font('Helvetica-Bold')
        .text('DADOS DO MOTORISTA');
      
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      
      const leftCol = 50;
      const rightCol = 150;
      let y = doc.y;
      
      doc.text('Nome:', leftCol, y, { continued: true, width: 100 });
      doc.text(data.driverName, rightCol, y);
      y += 20;
      
      doc.text('Tipo:', leftCol, y, { continued: true, width: 100 });
      doc.text(data.driverType === 'renter' ? 'Locatário' : 'Afiliado', rightCol, y);
      y += 20;
      
      if (data.vehiclePlate) {
        doc.text('Veículo:', leftCol, y, { continued: true, width: 100 });
        doc.text(data.vehiclePlate, rightCol, y);
        y += 20;
      }
      
      doc.text('Período:', leftCol, y, { continued: true, width: 100 });
      doc.text(`${data.weekStart} - ${data.weekEnd}`, rightCol, y);
      
      doc.moveDown(2);
      
      // ============================================================================
      // RECEITAS
      // ============================================================================
      
      doc.fontSize(11).font('Helvetica-Bold')
        .text('RECEITAS');
      
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      
      y = doc.y;
      doc.text('Uber (Total Repassado)', leftCol, y);
      doc.text(`${data.uberTotal.toFixed(2)} €`, 500, y, { width: 95, align: 'right' });
      y += 20;
      
      doc.text('Bolt (Total Repassado)', leftCol, y);
      doc.text(`${data.boltTotal.toFixed(2)} €`, 500, y, { width: 95, align: 'right' });
      y += 20;
      
      doc.font('Helvetica-Bold');
      doc.text('GANHOS TOTAL', leftCol, y);
      doc.text(`${data.ganhosTotal.toFixed(2)} €`, 500, y, { width: 95, align: 'right' });
      
      doc.moveDown(1);
      
      // IVA e Comissão
      doc.font('Helvetica');
      y = doc.y;
      
      doc.text('IVA (6%)', leftCol, y);
      doc.text(`-${data.ivaValor.toFixed(2)} €`, 500, y, { width: 95, align: 'right' });
      y += 20;
      
      doc.font('Helvetica-Bold');
      doc.text('Ganhos - IVA', leftCol, y);
      doc.text(`${data.ganhosMenosIva.toFixed(2)} €`, 500, y, { width: 95, align: 'right' });
      y += 20;
      
      doc.font('Helvetica');
      doc.text('Despesas Administrativas (7%)', leftCol, y);
      doc.text(`-${data.comissao.toFixed(2)} €`, 500, y, { width: 95, align: 'right' });
      
      doc.moveDown(2);
      
      // ============================================================================
      // DESCONTOS
      // ============================================================================
      
      doc.fontSize(11).font('Helvetica-Bold')
        .text('DESCONTOS');
      
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      
      y = doc.y;
      
      doc.text('Combustível', leftCol, y);
      doc.text(`-${data.combustivel.toFixed(2)} €`, 500, y, { width: 95, align: 'right' });
      y += 20;
      
      if (data.aluguel > 0) {
        doc.text('Aluguel Semanal', leftCol, y);
        doc.text(`-${data.aluguel.toFixed(2)} €`, 500, y, { width: 95, align: 'right' });
        y += 20;
      }
      
      if (data.viaverde > 0) {
        doc.text('Portagens (ViaVerde)', leftCol, y);
        doc.text(`-${data.viaverde.toFixed(2)} €`, 500, y, { width: 95, align: 'right' });
      }
      
      doc.moveDown(2);
      
      // ============================================================================
      // VALOR LÍQUIDO
      // ============================================================================
      
      doc.fontSize(14).font('Helvetica-Bold');
      
      // Box com fundo azul claro
      const boxY = doc.y;
      doc.rect(leftCol, boxY, 495, 30)
        .fillAndStroke('#C8DCFF', '#4472C4');
      
      doc.fillColor('#000000')
        .text('VALOR LÍQUIDO A RECEBER', leftCol + 10, boxY + 8);
      doc.text(`${data.repasse.toFixed(2)} €`, 500, boxY + 8, { width: 85, align: 'right' });
      
      doc.moveDown(2);
      
      // ============================================================================
      // DADOS BANCÁRIOS
      // ============================================================================
      
      doc.fontSize(11).font('Helvetica-Bold')
        .text('DADOS BANCÁRIOS');
      
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      
      y = doc.y;
      doc.text('IBAN:', leftCol, y, { continued: true, width: 100 });
      doc.text(data.iban, rightCol, y);
      y += 20;
      
      doc.text('Status:', leftCol, y, { continued: true, width: 100 });
      doc.fillColor(data.status === 'paid' ? '#48BB78' : '#D69E2E')
        .text(data.status === 'paid' ? 'PAGO' : 'PENDENTE', rightCol, y);
      
      doc.fillColor('#000000');
      doc.moveDown(2);
      
      // ============================================================================
      // OBSERVAÇÕES
      // ============================================================================
      
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666');
      
      const obs = [
        'OBSERVAÇÕES:',
        '- Valores Uber e Bolt são os totais repassados pelas plataformas',
        '- IVA de 6% aplicado sobre ganhos totais',
        '- Despesas administrativas de 7% aplicadas sobre (Ganhos - IVA)',
        data.aluguel > 0 ? '- Aluguel semanal incluído (Locatário)' : '- Sem aluguel (Afiliado)',
        data.viaverde > 0 
          ? `- Portagens (ViaVerde): ${data.viaverde.toFixed(2)} € - Pago pela empresa (descontado)`
          : '- Portagens (ViaVerde): Pago pelo motorista (não descontado)'
      ];
      
      doc.text(obs.join('\n'), leftCol, doc.y, { width: 495 });
      
      // ============================================================================
      // FOOTER
      // ============================================================================
      
      doc.fontSize(8).fillColor('#999999')
        .text(
          `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
          leftCol,
          doc.page.height - 30,
          { align: 'center', width: 495 }
        );
      
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Mascara IBAN para exibição
 */
export function maskIBAN(iban: string): string {
  if (!iban || iban.length < 8) return iban;
  const start = iban.substring(0, 4);
  const end = iban.substring(iban.length - 4);
  const middle = '*'.repeat(iban.length - 8);
  return `${start}${middle}${end}`;
}
