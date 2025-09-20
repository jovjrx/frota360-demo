// API Client para Dashboard Admin

export interface Driver {
  id: string;
  name?: string;
  email?: string;
  active: boolean;
  weeklyEarnings: number;
  monthlyEarnings: number;
  statusUpdatedAt?: number;
  statusUpdatedBy?: string;
}

export interface AdminStats {
  weeklyTotal: number;
  monthlyTotal: number;
  totalDrivers: number;
  activeDrivers: number;
}

export interface CreateAdminResult {
  success: boolean;
  uid?: string;
  error?: string;
}

export const adminAPI = {
  // Buscar lista de motoristas
  async getDrivers(): Promise<Driver[]> {
    const response = await fetch('/api/admin/drivers');
    
    if (!response.ok) {
      throw new Error('Erro ao buscar motoristas');
    }
    
    return response.json();
  },
  
  // Buscar estatísticas
  async getStats(): Promise<AdminStats> {
    const response = await fetch('/api/admin/stats');
    
    if (!response.ok) {
      throw new Error('Erro ao buscar estatísticas');
    }
    
    return response.json();
  },
  
  // Alterar status do motorista
  async toggleDriverStatus(driverId: string, isActive: boolean, adminId?: string) {
    const response = await fetch('/api/admin/toggle-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, isActive, adminId }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao alterar status');
    }
    
    return response.json();
  },
  
  // Criar usuário admin
  async createAdminUser(email: string, password: string): Promise<CreateAdminResult> {
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao criar usuário admin');
    }
    
    return response.json();
  },
  
  // Verificar se email é admin
  async isAdminEmail(email: string): Promise<boolean> {
    const response = await fetch('/api/admin/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.isAdmin || false;
  },
  
  // Buscar detalhes de um motorista
  async getDriverDetails(driverId: string) {
    const response = await fetch(`/api/admin/drivers/${driverId}`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar detalhes do motorista');
    }
    
    return response.json();
  },

  // Buscar todos os motoristas com detalhes
  async getAllMotorists() {
    const response = await fetch('/api/admin/motorists');
    
    if (!response.ok) {
      throw new Error('Erro ao buscar motoristas');
    }
    
    return response.json();
  },

  // Criar novo motorista
  async createMotorist(email: string, password: string, name: string, phone?: string, adminId?: string) {
    const response = await fetch('/api/admin/motorists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, phone, adminId }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao criar motorista');
    }
    
    return response.json();
  },

  // Atualizar motorista
  async updateMotorist(driverId: string, data: { name?: string; phone?: string; email?: string }, adminId?: string) {
    const response = await fetch('/api/admin/motorists', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, ...data, adminId }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao atualizar motorista');
    }
    
    return response.json();
  },

  // Deletar motorista
  async deleteMotorist(driverId: string, adminId?: string) {
    const response = await fetch('/api/admin/motorists', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, adminId }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao deletar motorista');
    }
    
    return response.json();
  },

  // Enviar notificação
  async sendNotification(userId: string, type: string, title: string, message: string, adminId?: string) {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, title, message, adminId }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao enviar notificação');
    }
    
    return response.json();
  },

  // Enviar notificação em massa
  async sendBulkNotification(userIds: string[], type: string, title: string, message: string, adminId?: string) {
    const response = await fetch('/api/notifications/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds, type, title, message, adminId }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao enviar notificações em massa');
    }
    
    return response.json();
  },

  // Buscar logs de auditoria
  async getAuditLogs(limit = 50, offset = 0, type?: string, userId?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (type) params.append('type', type);
    if (userId) params.append('userId', userId);
    
    const response = await fetch(`/api/admin/audit?${params}`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar logs de auditoria');
    }
    
    return response.json();
  },

  // Criar backup
  async createBackup(adminId?: string) {
    const response = await fetch('/api/admin/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao criar backup');
    }
    
    return response.json();
  },

  // Listar backups
  async listBackups(limit = 10) {
    const response = await fetch(`/api/admin/backup?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Erro ao listar backups');
    }
    
    return response.json();
  },
};
