// API Client para Dashboard do Motorista

export interface DriverData {
  name?: string;
  email?: string;
  phone?: string;
  weeklyEarnings: number;
  monthlyEarnings: number;
  documents: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    uploadedAt: number;
  }>;
  active: boolean;
  statusUpdatedAt?: number;
  statusUpdatedBy?: string;
}

export interface DriverStatus {
  success: boolean;
  active: boolean;
  statusUpdatedAt?: number;
  statusUpdatedBy?: string;
  error?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  createdBy: string;
  readAt?: number;
}

export const dashboardAPI = {
  // Upload de documento (real)
  async uploadDocument(userId: string, file: File, docType: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    formData.append('userId', userId);
    
    const response = await fetch('/api/painels/upload-real', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Erro ao fazer upload do documento');
    }
    
    return response.json();
  },
  
  // Verificar status do motorista
  async checkDriverStatus(userId: string): Promise<DriverStatus> {
    const response = await fetch(`/api/painels/status?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Erro ao verificar status');
    }
    
    return response.json();
  },
  
  // Buscar dados do motorista
  async getDriverData(userId: string): Promise<DriverData> {
    const response = await fetch(`/api/painels/data?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar dados');
    }
    
    return response.json();
  },
  
  // Buscar notificações
  async getNotifications(userId: string): Promise<Notification[]> {
    const response = await fetch(`/api/painels/notifications?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar notificações');
    }
    
    const result = await response.json();
    return result.notifications || [];
  },
  
  // Marcar notificação como lida
  async markNotificationAsRead(userId: string, notificationId: string) {
    const response = await fetch('/api/painels/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, notificationId }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao marcar notificação como lida');
    }
    
    return response.json();
  },

  // Buscar documentos
  async getDocuments(userId: string) {
    const response = await fetch(`/api/painels/documents?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar documentos');
    }
    
    return response.json();
  },

  // Deletar documento
  async deleteDocument(userId: string, documentId: string) {
    const response = await fetch('/api/painels/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, documentId }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao deletar documento');
    }
    
    return response.json();
  },

  // Buscar ganhos
  async getEarnings(userId: string) {
    const response = await fetch(`/api/painels/earnings?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar ganhos');
    }
    
    return response.json();
  },

  // Atualizar perfil
  async updateProfile(userId: string, data: { name?: string; phone?: string; email?: string }) {
    const response = await fetch('/api/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao atualizar perfil');
    }
    
    return response.json();
  },

  // Alterar senha
  async changePassword(userId: string, newPassword: string) {
    const response = await fetch('/api/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao alterar senha');
    }
    
    return response.json();
  },
};
