import React from 'react';
import GlobalStats, { GlobalStatItem } from './GlobalStats';
import { FiFolder, FiCheckCircle } from 'react-icons/fi';
import type { DocumentCategory } from '@/schemas/document-category';

interface DocumentCategoriesStatsProps {
  categories: DocumentCategory[];
  t: (key: string, fallback: string) => string;
}

export default function DocumentCategoriesStats({
  categories,
  t,
}: DocumentCategoriesStatsProps) {
  const total = categories.length;
  const active = categories.filter((c) => c.isActive).length;

  const items: GlobalStatItem[] = [
    {
      label: t('categories.stats.total', 'Total de Categorias'),
      value: total,
      helpText: t('categories.stats.totalDesc', 'Todos'),
      icon: FiFolder,
      color: 'blue.500',
    },
    {
      label: t('categories.stats.active', 'Categorias Ativas'),
      value: active,
      helpText: t('categories.stats.activeDesc', 'Habilitadas'),
      icon: FiCheckCircle,
      color: 'green.500',
    },
  ];

  return <GlobalStats items={items} />;
}
