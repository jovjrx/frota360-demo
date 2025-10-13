/**
 * Função compartilhada para processar dados semanais
 * Usada tanto pelo endpoint /api/admin/weekly/data quanto pelo SSR do dashboard
 */

import { adminDb } from '@/lib/firebaseAdmin';

export async function processWeeklyData(weekId: string, cookies?: string) {
  try {
    // Determinar URL base correta
    const baseUrl = process.env.NEXTAUTH_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar cookies para autenticação no SSR
    if (cookies) {
      headers['Cookie'] = cookies;
    }
    
    const response = await fetch(`${baseUrl}/api/admin/weekly/data?weekId=${weekId}`, {
      headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch weekly data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Erro ao buscar dados semanais para ${weekId}:`, error);
    throw error;
  }
}
