import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { generatePayslipPDF } from '@/lib/pdf/payslipGenerator';
import { buildPayslipDataFromRecord } from '@/lib/pdf/payslipData';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import type { WeeklyNormalizedData } from '@/schemas/data-weekly';
import { getSiteSettings } from '@/lib/site-settings';

/**
 * Verifica se está em modo demo
 */
function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Carrega dados demo de um driver
 */
function getDemoDriver(driverId: string): any {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const driversPath = path.join(process.cwd(), 'src/demo/drivers');
    const files = fs.readdirSync(driversPath);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(driversPath, file);
        const driver = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (driver.id === driverId) {
          return driver;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Erro ao carregar driver demo:', error);
    return null;
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { record } = req.body as { record?: DriverWeeklyRecord & { driverType?: string; vehicle?: string; platformData?: WeeklyNormalizedData[] } };

  if (!record) {
    return res.status(400).json({ message: 'Record payload is required' });
  }

  try {
    // Resolve driver data for richer PDF fields
    let driverData: Record<string, any> | undefined;
    
    if (isDemoMode()) {
      console.log(`[API generate-single] Modo demo detectado, buscando driver ${record.driverId}...`);
      driverData = record.driverId ? getDemoDriver(record.driverId) : null;
    } else {
      const driverDoc = record.driverId ? await adminDb.collection('drivers').doc(record.driverId).get() : null;
      driverData = driverDoc?.data() as (Record<string, any> | undefined);
    }

    const formattedWeekStart = formatDate(record.weekStart);
    const formattedWeekEnd = formatDate(record.weekEnd);
    const resolvedDriverType = driverData?.type === 'renter' ? 'renter' : record.driverType === 'renter' ? 'renter' : 'affiliate';

    const payslipData = buildPayslipDataFromRecord(record as any, {
      driverName: record.driverName,
      driverType: resolvedDriverType,
      vehiclePlate: driverData?.vehicle?.plate || (record as any).vehicle || 'DEMO-001',
      weekStart: formattedWeekStart,
      weekEnd: formattedWeekEnd,
    });

    // Try to inject site-branded logo (supports URL or relative public path)
    try {
      const settings = await getSiteSettings();
      const logo = settings?.branding?.logo;
      if (logo && typeof logo === 'string') {
        if (/^https?:\/\//i.test(logo)) {
          const resp = await fetch(logo);
          if (resp.ok) {
            const arr = await resp.arrayBuffer();
            (payslipData as any).logoBuffer = Buffer.from(arr);
          }
        } else if (logo.startsWith('/')) {
          // If relative path under public/, we keep default fallback in generator
          // Optionally could read the file, but default already points to /img/logo.png
        }
      }
    } catch (e) {
      // Non-fatal: fallback logo will be used
      console.warn('Could not load branding logo for payslip, using default:', (e as any)?.message);
    }

    const pdfBuffer = await generatePayslipPDF(payslipData);

    const sanitizedName = record.driverName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const fileName = `contracheque_${sanitizedName}_${record.weekStart}_a_${record.weekEnd}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Failed to generate payslip:', error);
    res.status(500).json({ message: 'Failed to generate payslip', error: error.message });
  }
}

