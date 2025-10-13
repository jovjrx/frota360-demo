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
  
  // Financiamento (opcional)
  financingInterestPercent?: number; // % de juros sobre a parcela
  financingInstallment?: number; // Parcela semanal
  financingInterestAmount?: number; // Valor dos juros
  financingTotalCost?: number; // Total (parcela + juros)
  
  // Repasse
  repasse: number;
}

/**
 * Gera PDF de contracheque
 */
export async function generatePayslipPDF(data: PayslipData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 0,
        bufferPages: true,
        autoFirstPage: true
      });
      
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const leftMargin = 50;
      const rightMargin = 545; // 595 - 50
      const contentWidth = 495;
      let currentY = 30; // Começar mais no topo

      // ============================================================================
      // HEADER COM LOGO
      // ============================================================================
      
      const logoPath = path.join(process.cwd(), 'public', 'img', 'logo.png');
      try {
        doc.image(logoPath, 222.5, currentY, { width: 150 });
        currentY += 80;
      } catch (e) {
        doc.fontSize(24).fillColor('#48BB78').text('CONDUZ.PT', leftMargin, currentY, { width: contentWidth, align: 'center' });
        currentY += 25;
      }
      
      // Alvorada Magistral LDA
      doc.fontSize(9).fillColor("#666666")
        .text("Alvorada Magistral LDA", leftMargin, currentY, { width: contentWidth, align: "center" });
      currentY += 10;
      
      // Website
      doc.fontSize(8).fillColor("#4472C4")
        .text("conduz.pt", leftMargin, currentY, { width: contentWidth, align: "center" });
      currentY += 18;
      
      // ============================================================================
      // TÍTULO
      // ============================================================================
      
      doc.fontSize(16).fillColor("#000000").font("Helvetica-Bold")
        .text("RESUMO SEMANAL", leftMargin, currentY, { width: contentWidth, align: "center" });
      currentY += 28;
      
      // ============================================================================
      // DADOS DO MOTORISTA
      // ============================================================================
      
      doc.fontSize(11).font("Helvetica-Bold")
        .text("DADOS DO MOTORISTA", leftMargin, currentY);
      currentY += 18;
      
      doc.fontSize(10).font("Helvetica");
      
      // Nome
      doc.text("Nome:", leftMargin, currentY);
      doc.text(data.driverName, leftMargin + 150, currentY);
      currentY += 14;
      
      // Tipo
      doc.text("Tipo:", leftMargin, currentY);
      doc.text(data.driverType === "renter" ? "Locatário" : "Afiliado", leftMargin + 150, currentY);
      currentY += 14;
      
      // Veículo
      if (data.vehiclePlate) {
        doc.text("Veículo:", leftMargin, currentY);
        doc.text(data.vehiclePlate, leftMargin + 150, currentY);
        currentY += 14;
      }
      
      // Período
      doc.text("Período:", leftMargin, currentY);
      doc.text(`${data.weekStart} - ${data.weekEnd}`, leftMargin + 150, currentY);
      currentY += 22;
      
      // ============================================================================
      // RECEITAS
      // ============================================================================
      
      doc.fontSize(11).font("Helvetica-Bold")
        .text("RECEITAS", leftMargin, currentY);
      currentY += 16;
      
      doc.fontSize(10).font("Helvetica");
      
      // Uber
      doc.text("Uber (Total Repassado)", leftMargin, currentY);
      doc.text(`${data.uberTotal.toFixed(2)} EUR`, rightMargin - 100, currentY, { width: 100, align: "right" });
      currentY += 14;
      
      // Bolt
      doc.text("Bolt (Total Repassado)", leftMargin, currentY);
      doc.text(`${data.boltTotal.toFixed(2)} EUR`, rightMargin - 100, currentY, { width: 100, align: "right" });
      currentY += 14;

      // GANHOS TOTAL
      doc.font("Helvetica-Bold");
      doc.text("GANHOS TOTAL", leftMargin, currentY);
      doc.text(`${data.ganhosTotal.toFixed(2)} EUR`, rightMargin - 100, currentY, { width: 100, align: "right" });
      currentY += 18;
      
      // IVA
      doc.font("Helvetica");
      doc.text("IVA (6%)", leftMargin, currentY);
      doc.text(`-${data.ivaValor.toFixed(2)} EUR`, rightMargin - 100, currentY, { width: 100, align: "right" });
      currentY += 14;
      
      // Ganhos - IVA
      doc.font("Helvetica-Bold");
      doc.text("Ganhos - IVA", leftMargin, currentY);
      doc.text(`${data.ganhosMenosIva.toFixed(2)} EUR`, rightMargin - 100, currentY, { width: 100, align: "right" });
      currentY += 14;
      
      // Despesas Administrativas
      doc.font("Helvetica");
      doc.text("Despesas Administrativas (7%)", leftMargin, currentY);
      doc.text(`-${data.comissao.toFixed(2)} EUR`, rightMargin - 100, currentY, { width: 100, align: "right" });
      currentY += 22;
      
      // ============================================================================
      // DESCONTOS
      // ============================================================================
      
      doc.fontSize(11).font("Helvetica-Bold")
        .text("DESCONTOS", leftMargin, currentY);
      currentY += 16;
      
      doc.fontSize(10).font("Helvetica");
      
      // Combustível
      doc.text("Combustível", leftMargin, currentY);
      doc.text(`-${data.combustivel.toFixed(2)} EUR`, rightMargin - 100, currentY, { width: 100, align: "right" });
      currentY += 14;
      
      // Aluguel (se houver)
      if (data.aluguel > 0) {
        doc.text("Aluguel Semanal", leftMargin, currentY);
        doc.text(`-${data.aluguel.toFixed(2)} EUR`, rightMargin - 100, currentY, { width: 100, align: "right" });
        currentY += 14;
      }
      
      // Portagens (se houver)
      if (data.viaverde > 0) {
        doc.text("Portagens (ViaVerde)", leftMargin, currentY);
        doc.text(`-${data.viaverde.toFixed(2)} EUR`, rightMargin - 100, currentY, { width: 100, align: "right" });
        currentY += 14;
      }
      
      // Financiamento (se houver)
      if (data.financingInstallment && data.financingInstallment > 0) {
        doc.text("Financiamento (parcela)", leftMargin, currentY);
        doc.text(`-${data.financingInstallment.toFixed(2)} EUR`, rightMargin - 100, currentY, { width: 100, align: "right" });
        currentY += 14;
        
        if (data.financingInterestAmount && data.financingInterestAmount > 0) {
          doc.text(`  → Juros (${data.financingInterestPercent}%)`, leftMargin, currentY);
          doc.text(`-${data.financingInterestAmount.toFixed(2)} EUR`, rightMargin - 100, currentY, { width: 100, align: "right" });
          currentY += 14;
        }
      }
      
      currentY += 10;
      
      // ============================================================================
      // VALOR LÍQUIDO A RECEBER
      // ============================================================================
      
      // Box com borda azul
      doc.rect(leftMargin, currentY, contentWidth, 35)
        .lineWidth(2)
        .strokeColor("#4472C4")
        .fillColor("#E8F0FE")
        .fillAndStroke();
      
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#000000");
      doc.text("VALOR LÍQUIDO A RECEBER", leftMargin + 10, currentY + 10);
      doc.text(`${data.repasse.toFixed(2)} EUR`, rightMargin - 110, currentY + 10, { width: 100, align: "right" });
      
      currentY += 50;
      
      // ============================================================================
      // OBSERVAÇÕES
      // ============================================================================
      
      doc.fontSize(8).font("Helvetica-Oblique").fillColor("#666666");
      
      const obs = [
        "OBSERVAÇÕES:",
        "- IVA de 6% aplicado sobre ganhos totais | Despesas administrativas de 7% fixo sobre (Ganhos - IVA)",
        data.aluguel > 0 ? "- Aluguel semanal incluído (Locatário)" : "- Sem aluguel (Afiliado)",
        data.financingInstallment && data.financingInstallment > 0
          ? data.financingInterestAmount && data.financingInterestAmount > 0
            ? `- Financiamento: Total ${data.financingTotalCost?.toFixed(2)} EUR (Parcela: ${data.financingInstallment.toFixed(2)} EUR + Juros: ${data.financingInterestAmount.toFixed(2)} EUR)`
            : `- Financiamento: ${data.financingInstallment.toFixed(2)} EUR (sem juros)`
          : ""
      ].filter(line => line !== "");
      
      doc.text(obs.join("\n"), leftMargin, currentY, { width: contentWidth, lineGap: 1 });
      
      // ============================================================================
      // FOOTER
      // ============================================================================
      
      doc.fontSize(8).fillColor("#999999")
        .text(
          `Documento gerado em ${new Date().toLocaleDateString('pt-PT')}`,
          leftMargin,
          780,
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
