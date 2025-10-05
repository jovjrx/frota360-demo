/**
 * API Universal de Dados Admin
 * 
 * Endpoint único que retorna todos os dados unificados do sistema
 * 
 * Query params:
 * - startDate: data inicial (ISO string)
 * - endDate: data final (ISO string)
 * - days: número de dias (alternativa a startDate/endDate)
 * - include: lista separada por vírgula do que incluir (drivers,vehicles,fleet,integrations,requests,weekly)
 * - driverStatus: active|inactive|all
 * - vehicleStatus: active|inactive|maintenance|all
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { 
  fetchUnifiedAdminData, 
  fetchDashboardData, 
  fetchDriverMetricsData,
  FetchOptions 
} from '@/lib/admin/unified-data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      startDate: startDateParam,
      endDate: endDateParam,
      days,
      include,
      driverStatus,
      vehicleStatus,
      preset,
    } = req.query;

    // Usar preset se fornecido
    if (preset === 'dashboard') {
      const data = await fetchDashboardData(days ? parseInt(days as string) : 30);
      return res.status(200).json({ success: true, data });
    }

    if (preset === 'driver-metrics') {
      const data = await fetchDriverMetricsData(days ? parseInt(days as string) : 30);
      return res.status(200).json({ success: true, data });
    }

    // Calcular datas
    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam as string);
      endDate = new Date(endDateParam as string);
    } else if (days) {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));
    } else {
      // Default: últimos 30 dias
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    // Parse include parameter
    const includeList = include ? (include as string).split(',') : [];
    
    const options: FetchOptions = {
      startDate,
      endDate,
      includeDrivers: includeList.length === 0 || includeList.includes('drivers'),
      includeVehicles: includeList.length === 0 || includeList.includes('vehicles'),
      includeFleetRecords: includeList.length === 0 || includeList.includes('fleet'),
      includeIntegrations: includeList.length === 0 || includeList.includes('integrations'),
      includeRequests: includeList.length === 0 || includeList.includes('requests'),
      includeWeeklyRecords: includeList.includes('weekly'),
      driverStatus: (driverStatus as any) || 'active',
      vehicleStatus: (vehicleStatus as any) || 'all',
    };

    const data = await fetchUnifiedAdminData(options);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error in unified admin data API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
