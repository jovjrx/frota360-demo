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
  prioTotal: number;
  viaverdeTotal: number;
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
        margins: { top: 40, bottom: 40, left: 50, right: 50 } 
      });
      
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const leftMargin = 50;
      const rightMargin = 545; // 595 - 50
      const contentWidth = 495; // rightMargin - leftMargin

      // ============================================================================
      // HEADER COM LOGO
      // ============================================================================
      
      // Logo CONDUZ (centralizada)
      const logoPath = path.join(process.cwd(), 'public', 'img', 'logo.png');
      try {
        // Centralizar: (595 - 180) / 2 = 207.5
        doc.image(logoPath, 207.5, 40, { width: 180 });
        doc.moveDown(5);
      } catch (e) {
        // Se logo não existir, usar texto
        doc.fontSize(24).fillColor('#48BB78').text('CONDUZ.PT', { align: 'center' });
        doc.moveDown(1);
      }
      
      // Alvorada Magistral LDA
      doc.fontSize(10).fillColor("#666666")
        .text("Alvorada Magistral LDA", { align: "center" });
      
      // Website
      doc.fontSize(9).fillColor("#4472C4")
        .text("conduz.pt", { align: "center" });
      
      doc.moveDown(2);
      
      // ============================================================================
      // TÍTULO
      // ============================================================================
      
      doc.fontSize(16).fillColor("#000000").font("Helvetica-Bold")
        .text("CONTRACHEQUE SEMANAL", { align: "center" });
      
      doc.moveDown(2);
      
      // ============================================================================
      // DADOS DO MOTORISTA
      // ============================================================================
      
      doc.fontSize(11).font("Helvetica-Bold")
        .text("DADOS DO MOTORISTA", leftMargin);
      
      doc.moveDown(0.5);
      
      doc.fontSize(10).font("Helvetica");
      
      let y = doc.y;
      
      // Nome
      doc.text("Nome:", leftMargin, y, { continued: false });
      doc.text(data.driverName, leftMargin + 150, y);
      y += 15;
      
      // Tipo
      doc.text("Tipo:", leftMargin, y);
      doc.text(data.driverType === "renter" ? "Locatário" : "Afiliado", leftMargin + 150, y);
      y += 15;
      
      // Veículo
      if (data.vehiclePlate) {
        doc.text("Veículo:", leftMargin, y);
        doc.text(data.vehiclePlate, leftMargin + 150, y);
        y += 15;
      }
      
      // Período
      doc.text("Período:", leftMargin, y);
      doc.text(`${data.weekStart} - ${data.weekEnd}`, leftMargin + 150, y);
      
      doc.moveDown(2);
      
      // ============================================================================
      // RECEITAS
      // ============================================================================
      
      doc.fontSize(11).font("Helvetica-Bold")
        .text("RECEITAS", leftMargin);
      
      doc.moveDown(0.5);
      
      doc.fontSize(10).font("Helvetica");
      
      y = doc.y;
      
      // Uber
      doc.text("Uber (Total Repassado)", leftMargin, y);
      doc.text(`${data.uberTotal.toFixed(2)} EUR`, rightMargin - 100, y, { width: 100, align: "right" });
      y += 15;
      
      // Bolt
      doc.text("Bolt (Total Repassado)", leftMargin, y);
      doc.text(`${data.boltTotal.toFixed(2)} EUR`, rightMargin - 100, y, { width: 100, align: "right" });
      y += 15;

      // GANHOS TOTAL
      doc.font("Helvetica-Bold");
      doc.text("GANHOS TOTAL", leftMargin, y);
      doc.text(`${data.ganhosTotal.toFixed(2)} EUR`, rightMargin - 100, y, { width: 100, align: "right" });
      y += 20;
      
      // IVA
      doc.font("Helvetica");
      doc.text("IVA (6%)", leftMargin, y);
      doc.text(`-${data.ivaValor.toFixed(2)} EUR`, rightMargin - 100, y, { width: 100, align: "right" });
      y += 15;
      
      // Ganhos - IVA
      doc.font("Helvetica-Bold");
      doc.text("Ganhos - IVA", leftMargin, y);
      doc.text(`${data.ganhosMenosIva.toFixed(2)} EUR`, rightMargin - 100, y, { width: 100, align: "right" });
      y += 15;
      
      // Despesas Administrativas
      doc.font("Helvetica");
      doc.text("Despesas Administrativas (7%)", leftMargin, y);
      doc.text(`-${data.comissao.toFixed(2)} EUR`, rightMargin - 100, y, { width: 100, align: "right" });
      
      doc.moveDown(2);
      
      // ============================================================================
      // DESCONTOS
      // ============================================================================
      
      doc.fontSize(11).font("Helvetica-Bold")
        .text("DESCONTOS", leftMargin);
      
      doc.moveDown(0.5);
      
      doc.fontSize(10).font("Helvetica");
      
      y = doc.y;
      
      // Combustível
      doc.text("Combustível", leftMargin, y);
      doc.text(`-${data.combustivel.toFixed(2)} EUR`, rightMargin - 100, y, { width: 100, align: "right" });
      y += 15;
      
      // Aluguel (se houver)
      if (data.aluguel > 0) {
        doc.text("Aluguel Semanal", leftMargin, y);
        doc.text(`-${data.aluguel.toFixed(2)} EUR`, rightMargin - 100, y, { width: 100, align: "right" });
        y += 15;
      }
      
      // Portagens (se houver)
      if (data.viaverde > 0) {
        doc.text("Portagens (ViaVerde)", leftMargin, y);
        doc.text(`-${data.viaverde.toFixed(2)} EUR`, rightMargin - 100, y, { width: 100, align: "right" });
        y += 15;
      }
      
      doc.moveDown(2);
      
      // ============================================================================
      // VALOR LÍQUIDO A RECEBER
      // ============================================================================
      
      y = doc.y;
      
      // Box com borda azul
      doc.rect(leftMargin, y, contentWidth, 35)
        .lineWidth(2)
        .strokeColor("#4472C4")
        .fillColor("#E8F0FE")
        .fillAndStroke();
      
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#000000");
      doc.text("VALOR LÍQUIDO A RECEBER", leftMargin + 10, y + 10, { continued: false });
      doc.text(`${data.repasse.toFixed(2)} EUR`, rightMargin - 110, y + 10, { width: 100, align: "right" });
      
      doc.moveDown(3);
      
      // ============================================================================
      // DADOS BANCÁRIOS
      // ============================================================================
      
      doc.fontSize(11).font("Helvetica-Bold")
        .text("DADOS BANCÁRIOS", leftMargin);
      
      doc.moveDown(0.5);
      
      doc.fontSize(10).font("Helvetica");
      
      y = doc.y;
      
      // IBAN
      doc.text("IBAN:", leftMargin, y);
      doc.text(data.iban, leftMargin + 150, y);
      y += 15;
      
      // Status
      doc.text("Status:", leftMargin, y);
      const statusText = data.status === "paid" ? "PAGO" : "PENDENTE";
      const statusColor = data.status === "paid" ? "#48BB78" : "#D69E2E";
      doc.fillColor(statusColor).text(statusText, leftMargin + 150, y);
      
      doc.fillColor("#000000");
      doc.moveDown(2);
      
      // ============================================================================
      // OBSERVAÇÕES
      // ============================================================================
      
      doc.fontSize(9).font("Helvetica-Oblique").fillColor("#666666");
      
      const obs = [
        "OBSERVAÇÕES:",
        "- Valores Uber e Bolt são os totais repassados pelas plataformas",
        "- IVA de 6% aplicado sobre ganhos totais",
        "- Despesas administrativas de 7% aplicadas sobre (Ganhos - IVA)",
        data.aluguel > 0 ? "- Sem aluguel (Afiliado)" : "- Aluguel semanal incluído (Locatário)",
        data.viaverde > 0 
          ? `- Portagens (ViaVerde): ${data.viaverde.toFixed(2)} EUR - Pago pelo motorista (não descontado)`
          : "- Portagens (ViaVerde): 0.00 EUR - Pago pelo motorista (não descontado)"
      ];
      
      doc.text(obs.join("\n"), leftMargin, doc.y, { width: contentWidth, lineGap: 2 });
      
      // ============================================================================
      // FOOTER
      // ============================================================================
      
      doc.fontSize(8).fillColor("#999999")
        .text(
          `Página 1`,
          leftMargin,
          doc.page.height - 30,
          { align: "center", width: contentWidth }
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
