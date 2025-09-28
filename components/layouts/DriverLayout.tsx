import React from 'react';
import UnifiedLayout from './UnifiedLayout';

interface DriverLayoutProps {
  title: string;
  subtitle?: string;
  user: {
    name: string;
    avatar?: string;
    role: 'admin' | 'driver';
    status?: string;
  };
  notifications?: number;
  alerts?: Array<{
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    description: string;
  }>;
  stats?: Array<{
    label: string;
    value: string | number;
    helpText?: string;
    arrow?: 'increase' | 'decrease';
    color?: string;
  }>;
  children: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export default function DriverLayout(props: DriverLayoutProps) {
  return <UnifiedLayout {...props} basePath="/drivers" />;
}
