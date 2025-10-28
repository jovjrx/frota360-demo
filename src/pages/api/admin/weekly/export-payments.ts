import { NextApiRequest, NextApiResponse } from 'next';
import ExcelJS from 'exceljs';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';
import { DriverPayment } from '@/schemas/driver-payment';

interface DriverRecord extends DriverWeeklyRecord {
  driverType: 'affiliate' | 'renter';
  vehicle: string;
  platformData: WeeklyNormalizedData[];
  paymentInfo?: DriverPayment | null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value || 0);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { records, weekId } = req.body;

    if (!records || !Array.isArray(records) || !weekId) {
      return res.status(400).json({ message: 'Records and weekId are required' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pagamentos Semanais');

    // Definir largura das colunas
    worksheet.columns = [
      { key: 'driverName', width: 25 },
      { key: 'driverType', width: 12 },
      { key: 'vehicle', width: 12 },
      { key: 'uber', width: 12 },
      { key: 'bolt', width: 12 },
      { key: 'ganhosTotal', width: 14 },
      { key: 'ivaValor', width: 12 },
      { key: 'ganhosMenosIVA', width: 14 },
  { key: 'commissionAmount', width: 12 },
  { key: 'despesasAdm', width: 12 },
      { key: 'combustivel', width: 12 },
      { key: 'viaverde', width: 12 },
      { key: 'aluguel', width: 12 },
      { key: 'financingInstallment', width: 14 },
      { key: 'financingInterest', width: 12 },
      { key: 'financingTotal', width: 14 },
      { key: 'repasse', width: 14 },
      { key: 'bonus', width: 12 },
      { key: 'discount', width: 12 },
      { key: 'totalPaid', width: 14 },
      { key: 'paymentStatus', width: 12 },
      { key: 'paymentDate', width: 14 },
      { key: 'iban', width: 25 },
      { key: 'notes', width: 30 },
    ];

    // HEADER PRINCIPAL - Informações da Semana
    const titleRow = worksheet.addRow(['RELATÓRIO DE PAGAMENTOS SEMANAIS']);
    titleRow.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2D3748' }, // Cinza escuro
    };
    titleRow.height = 30;
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.mergeCells('A1:W1');

    // Informações da semana
    const weekInfo = records[0];
    const infoRow = worksheet.addRow([
      `Semana: ${weekId} | Período: ${weekInfo?.weekStart || 'N/A'} a ${weekInfo?.weekEnd || 'N/A'} | Total de motoristas: ${records.length}`
    ]);
    infoRow.font = { size: 11, color: { argb: 'FF4A5568' } };
    infoRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }, // Cinza claro
    };
    infoRow.height = 25;
    infoRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.mergeCells('A2:W2');

    // Linha vazia
    worksheet.addRow([]);

    // HEADER DAS COLUNAS - Agrupado por categorias
    const categoryRow = worksheet.addRow([
      'MOTORISTA', '', '', 
      'RECEITAS', '', '', '', '', 
      'DESPESAS', '', '', '', '', '', '', '',
      'LÍQUIDO', '', '', '',
      'PAGAMENTO', '', '', ''
    ]);
    categoryRow.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    categoryRow.alignment = { vertical: 'middle', horizontal: 'center' };
    categoryRow.height = 25;

    // Cores das categorias
    ['A4', 'B4', 'C4'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4299E1' }, // Azul
      };
    });
    ['D4', 'E4', 'F4', 'G4', 'H4', 'I4'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF48BB78' }, // Verde
      };
    });
    ['J4', 'K4', 'L4', 'M4', 'N4', 'O4', 'P4', 'Q4'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFED8936' }, // Laranja
      };
    });
    ['R4', 'S4', 'T4', 'U4'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF9F7AEA' }, // Roxo
      };
    });
    ['V4', 'W4', 'X4', 'Y4'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4A5568' }, // Cinza
      };
    });

    // HEADER DAS COLUNAS - Nomes específicos
    const headerRow = worksheet.addRow([
      'Nome',
      'Tipo',
      'Veículo',
      'Uber',
      'Bolt',
      'Ganhos Total',
      'IVA (6%)',
      'Ganhos - IVA',
  'Commission',
      'Taxa Adm (7%)',
      'Combustível',
      'Portagens',
      'Aluguel',
      'Financ. Parcela',
      'Financ. Juros',
      'Financ. Total',
      'Repasse',
      'Bônus',
      'Desconto',
      'Total Pago',
      'Status',
      'Data Pag.',
      'IBAN',
      'Observações',
    ]);
    headerRow.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 35;

    // Aplicar mesmas cores do header de categoria
    ['A5', 'B5', 'C5'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2C5282' }, // Azul escuro
      };
    });
    ['D5', 'E5', 'F5', 'G5', 'H5', 'I5'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2F855A' }, // Verde escuro
      };
    });
    ['J5', 'K5', 'L5', 'M5', 'N5', 'O5', 'P5', 'Q5'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC05621' }, // Laranja escuro
      };
    });
    ['R5', 'S5', 'T5', 'U5'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B46C1' }, // Roxo escuro
      };
    });
    ['V5', 'W5', 'X5', 'Y5'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2D3748' }, // Cinza escuro
      };
    });

    // DADOS DOS MOTORISTAS
    let totalGanhos = 0;
    let totalIVA = 0;
    let totalDespesas = 0;
    let totalRepasse = 0;
    let totalPago = 0;

    records.forEach((record: DriverRecord, index: number) => {
      const financing = (record as any).financingDetails || {};
      const commissionAmount = (record as any).commissionAmount || 0;
      
      const row = worksheet.addRow([
        record.driverName,
        record.driverType === 'affiliate' ? 'Afiliado' : 'Locatário',
        record.vehicle || 'N/A',
        record.uberTotal || 0,
        record.boltTotal || 0,
        record.ganhosTotal || 0,
        record.ivaValor || 0,
        record.ganhosMenosIVA || 0,
        commissionAmount,
        record.despesasAdm || 0,
        record.combustivel || 0,
        record.viaverde || 0,
        record.aluguel || 0,
        financing.installment || 0,
        financing.interestAmount || 0,
        financing.totalCost || 0,
        record.repasse || 0,
        record.paymentInfo?.bonusAmount || 0,
        record.paymentInfo?.discountAmount || 0,
        record.paymentInfo?.totalAmount || record.repasse || 0,
        record.paymentStatus === 'paid' ? 'Pago' : 'Pendente',
        record.paymentDate ? new Date(record.paymentDate).toLocaleDateString('pt-PT') : '-',
        record.iban || '-',
        record.paymentInfo?.notes || '',
      ]);

      // Formatar valores monetários
      ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'].forEach(col => {
        const cell = worksheet.getCell(`${col}${row.number}`);
        cell.numFmt = '€#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      });

      // Cor alternada nas linhas
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF7FAFC' }, // Cinza bem claro
          };
        });
      }

      // Status com cor
  const statusCell = worksheet.getCell(`V${row.number}`);
      if (record.paymentStatus === 'paid') {
        statusCell.font = { color: { argb: 'FF22543D' }, bold: true };
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC6F6D5' }, // Verde claro
        };
      } else {
        statusCell.font = { color: { argb: 'FF7C2D12' }, bold: true };
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFED7D7' }, // Vermelho claro
        };
      }

      statusCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Totais
      totalGanhos += record.ganhosTotal || 0;
      totalIVA += record.ivaValor || 0;
  totalDespesas += (record.combustivel || 0) + (record.viaverde || 0) + (record.aluguel || 0) + (financing.totalCost || 0);
      totalRepasse += record.repasse || 0;
      totalPago += record.paymentInfo?.totalAmount || record.repasse || 0;
    });

    // LINHA DE TOTAIS
    const totalRow = worksheet.addRow([
      'TOTAL',
      '',
      '',
      '', // Uber (não totalizar)
      '', // Bolt (não totalizar)
      totalGanhos,
      totalIVA,
      '', // Ganhos - IVA (calculado)
      '', // Taxa Adm (calculado)
      '', // Comissão (individual)
      '', // Combustível individual
      '', // Portagens individual
      '', // Aluguel individual
      '', // Financ. Parcela individual
      '', // Financ. Juros individual
      '', // Financ. Total individual
      totalRepasse,
      '', // Bônus
      '', // Desconto
      totalPago,
      '', // Status
      '', // Data
      '', // IBAN
      '', // Obs
    ]);

    totalRow.font = { size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2D3748' },
    };
    totalRow.height = 30;
    totalRow.alignment = { vertical: 'middle', horizontal: 'right' };

    // Formatar valores dos totais
    ['F', 'G', 'Q', 'T'].forEach(col => {
      const cell = worksheet.getCell(`${col}${totalRow.number}`);
      cell.numFmt = '€#,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    });

    // Aplicar bordas em todas as células com dados
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 4) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
        });
      }
    });

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Disposition', `attachment; filename=pagamentos_semana_${weekId}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(Buffer.from(buffer));

  } catch (error: any) {
    console.error('Error exporting payments:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

