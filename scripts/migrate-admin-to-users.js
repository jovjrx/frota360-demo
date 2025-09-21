// Script para migrar admin da tabela admins para users
// Execute este script uma vez para migrar os dados

import { adminDb } from './lib/firebaseAdmin';

async function migrateAdminToUsers() {
  try {
    console.log('Iniciando migração do admin para tabela users...');

    // Buscar todos os admins
    const adminsSnapshot = await adminDb.collection('admins').get();
    
    if (adminsSnapshot.empty) {
      console.log('Nenhum admin encontrado na tabela admins');
      return;
    }

    console.log(`Encontrados ${adminsSnapshot.docs.length} admin(s)`);

    // Migrar cada admin para users
    for (const adminDoc of adminsSnapshot.docs) {
      const adminData = adminDoc.data();
      const uid = adminDoc.id;

      console.log(`Migrando admin: ${adminData.email} (${uid})`);

      // Criar documento na coleção users
      const userData = {
        uid: uid,
        email: adminData.email,
        name: adminData.name || adminData.email.split('@')[0],
        role: adminData.role || 'admin',
        createdAt: adminData.createdAt || new Date(),
        updatedAt: new Date(),
      };

      // Verificar se já existe na tabela users
      const existingUser = await adminDb.collection('users').doc(uid).get();
      
      if (existingUser.exists) {
        console.log(`Admin ${adminData.email} já existe na tabela users, atualizando...`);
        await adminDb.collection('users').doc(uid).update({
          ...userData,
          updatedAt: new Date(),
        });
      } else {
        console.log(`Criando novo usuário ${adminData.email} na tabela users...`);
        await adminDb.collection('users').doc(uid).set(userData);
      }

      console.log(`✅ Admin ${adminData.email} migrado com sucesso`);
    }

    console.log('🎉 Migração concluída!');
    console.log('Agora você pode deletar a tabela admins se desejar.');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

// Executar migração
migrateAdminToUsers();
