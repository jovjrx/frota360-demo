import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import processHandler from '@/pages/api/admin/imports/process';

async function simulateProcessApi() {
  const importId = '2025-W40-1759789137950'; // Use o importId gerado pelo script import_raw_data.ts

  const req = {
    method: 'POST',
    body: { importId },
    headers: {},
    // Mock da sessão para o teste interno, se necessário
    // req.session = { isLoggedIn: true, role: 'admin' };
  } as NextApiRequest;

  const res = {
    status: (statusCode: number) => {
      console.log(`API Status: ${statusCode}`);
      return {
        json: (data: any) => {
          console.log('API Response:', data);
        },
      };
    },
  } as NextApiResponse;

  console.log(`Chamando API de processamento para importId: ${importId}`);
  await processHandler(req, res);
  console.log('Processamento da API concluído.');
}

simulateProcessApi().catch(console.error);

