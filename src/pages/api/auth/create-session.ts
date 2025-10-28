import { NextApiRequest, NextApiResponse } from 'next';
import { createSession } from '@/lib/session/ironSession';
import * as fs from 'fs';
import * as path from 'path';

// Função para ler users dos arquivos JSON
function getUsersFromDemo() {
  const usersPath = path.join(process.cwd(), 'src/demo/users');
  const files = fs.readdirSync(usersPath);
  
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(usersPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    });
}

// Função para ler drivers dos arquivos JSON
function getDriversFromDemo() {
  const driversPath = path.join(process.cwd(), 'src/demo/drivers');
  const files = fs.readdirSync(driversPath);
  
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(driversPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    });
}

// Função para autenticar sem Firebase
async function authenticateUser(email: string, password: string) {
  // Buscar em users primeiro
  const users = getUsersFromDemo();
  const user = users.find(u => u.email === email);
  
  if (user && user.password === password) {
    return { ...user, source: 'users' };
  }
  
  // Buscar em drivers
  const drivers = getDriversFromDemo();
  const driver = drivers.find(d => d.email === email);
  
  if (driver && driver.password === password) {
    return { ...driver, source: 'drivers' };
  }
  
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    console.log(`🔍 Buscando usuário: Email=${email}`);

    // Autenticar o usuário (sem Firebase)
    const authenticatedUser = await authenticateUser(email, password);
    
    if (!authenticatedUser) {
      console.error(`❌ Credenciais inválidas: Email=${email}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    console.log(`✅ Usuário autenticado: ${authenticatedUser.name} (Role: ${authenticatedUser.role})`);

    // Verificar se é admin
    if (authenticatedUser.role === 'admin' || authenticatedUser.isAdmin === true) {
      await createSession(req, res, {
        userId: authenticatedUser.id || authenticatedUser.uid,
        role: 'admin',
        email: authenticatedUser.email,
        name: authenticatedUser.name || authenticatedUser.displayName,
        driverId: null,
        user: {
          id: authenticatedUser.id || authenticatedUser.uid,
          role: 'admin',
          email: authenticatedUser.email,
          name: authenticatedUser.name || authenticatedUser.displayName,
        },
      });

      return res.status(200).json({ success: true, role: 'admin' });
    }

    // Verificar se é motorista
    if (authenticatedUser.role === 'driver') {
      // Verificar status do motorista
      const status = authenticatedUser.status || (authenticatedUser.isActive ? 'active' : 'inactive');
      if (status !== 'active') {
        console.warn(`🚫 Login bloqueado para motorista ${email} com status='${status}'.`);
        return res.status(403).json({ error: 'Sua conta de motorista não está ativa. Entre em contato com o suporte.' });
      }

      await createSession(req, res, {
        userId: authenticatedUser.id || authenticatedUser.uid,
        role: 'driver',
        email: authenticatedUser.email,
        name: authenticatedUser.name || authenticatedUser.displayName,
        driverId: authenticatedUser.email,
        user: {
          id: authenticatedUser.id || authenticatedUser.uid,
          role: 'driver',
          email: authenticatedUser.email,
          name: authenticatedUser.name || authenticatedUser.displayName,
        },
      });

      return res.status(200).json({ success: true, role: 'driver' });
    }

    // ❌ Role não reconhecida
    console.error(`❌ Role não reconhecida: ${authenticatedUser.role}`);
    return res.status(403).json({ error: 'Role não autorizado' });

  } catch (error: any) {
    console.error('Erro ao criar sessão:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}

