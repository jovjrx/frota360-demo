import { NextApiRequest, NextApiResponse } from 'next';
import * as XLSX from 'xlsx';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { records, weekId } = req.body;

    if (!records || !Array.isArray(records) || !weekId) {
      return res.status(400).json({ message: 'Records and weekId are required' });
    }

    const data = records.map((record: DriverWeeklyRecord) => ({
      'ID Motorista': record.driverId,
      'Nome Motorista': record.driverName,
      'Tipo Motorista': record.driverType === 'affiliate' ? 'Afiliado' : 'Locatário',
      'Veículo': record.vehicle,
      'Ganhos Total (€)': record.ganhosTotal,
      'IVA (€)': record.ivaValor,
      'Despesas Adm (€)': record.despesasAdm,
      'Combustível (€)': record.combustivel,
      'ViaVerde (€)': record.viaverde,
      'Aluguel (€)': record.aluguel,
      'Repasse Líquido (€)': record.repasse,
      'Status Pagamento': record.paymentStatus === 'paid' ? 'Pago' : 'Pendente',
      'Data Pagamento': record.paymentDate ? new Date(record.paymentDate).toLocaleDateString('pt-PT') : 'N/A',
      'Última Atualização': new Date(record.updatedAt).toLocaleString('pt-PT'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pagamentos Semanais');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=pagamentos_semana_${weekId}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error: any) {
    console.error('Error exporting payments:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
