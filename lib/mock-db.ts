// lib/mock-db.ts

import motoristasData from '@/data/motoristas.json';
import pagamentosData from '@/data/pagamentos.json';
import metasData from '@/data/metas.json';

export const mockDB = {
  // Motoristas
  getMotoristas: () => motoristasData.motoristas,
  getMotoristaById: (id: string) => motoristasData.motoristas.find(m => m.id === id),
  getMotoristasByStatus: (status: string) => motoristasData.motoristas.filter(m => m.status === status),
  getMotoristaAtivo: () => motoristasData.motoristas.filter(m => m.status === 'Ativo'),

  // Pagamentos
  getPagamentos: () => pagamentosData.pagamentos,
  getPagamentosByMotorista: (motorista_id: string) => pagamentosData.pagamentos.filter(p => p.motorista_id === motorista_id),
  getPagamentosBySemana: (semana: string) => pagamentosData.pagamentos.filter(p => p.semana === semana),
  getPagamentosRecentes: (limit: number = 10) => pagamentosData.pagamentos.slice(0, limit),

  // Metas
  getMetas: () => metasData.metas,
  getMetasAtivas: () => metasData.metas.filter(m => m.status === 'Ativa'),
  getMetaById: (id: string) => metasData.metas.find(m => m.id === id),

  // Estatísticas
  getEstatisticas: () => {
    const motoristas = motoristasData.motoristas;
    const pagamentos = pagamentosData.pagamentos;
    
    return {
      total_motoristas: motoristas.length,
      motoristas_ativos: motoristas.filter(m => m.status === 'Ativo').length,
      total_ganho_bruto: pagamentos.reduce((sum, p) => sum + (p.detalhes?.ganho_bruto || 0), 0),
      total_repasse: pagamentos.reduce((sum, p) => sum + p.repasse, 0),
      pagamentos_pendentes: pagamentos.filter(p => p.status === 'Pendente').length,
      pagamentos_pagos: pagamentos.filter(p => p.status === 'Pago').length,
    };
  },
};

