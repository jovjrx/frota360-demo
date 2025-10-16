import { IconType } from 'react-icons';
import {
  FiHome,
  FiUser,
  FiFileText,
  FiMapPin,
  FiHelpCircle,
  FiBarChart,
  FiDollarSign,
  FiEdit,
} from 'react-icons/fi';

export interface DashboardMenuItem {
  id: string;
  label: string;
  href: string;
  icon: IconType;
}

/**
 * Menu items do dashboard do motorista
 * Os labels são chaves de tradução que serão traduzidas no componente
 * usando: t(`menu.${item.id}`)
 */
export const dashboardMenuItems: DashboardMenuItem[] = [
  {
    id: 'dashboard',
    label: 'dashboard', // Traduzido via t('menu.dashboard')
    href: '/dashboard',
    icon: FiHome,
  },
  {
    id: 'data',
    label: 'data', // Traduzido via t('menu.data')
    href: '/dashboard/data',
    icon: FiUser,
  },
  {
    id: 'payslips',
    label: 'payslips', // Traduzido via t('menu.payslips')
    href: '/dashboard/payslips',
    icon: FiFileText,
  },
  {
    id: 'contracts',
    label: 'contracts',
    href: '/dashboard/contracts',
    icon: FiEdit,
  },
  {
    id: 'financing',
    label: 'financing', // Traduzido via t('menu.financing')
    href: '/dashboard/financing',
    icon: FiDollarSign,
  },
  {
    id: 'tracking',
    label: 'tracking', // Traduzido via t('menu.tracking')
    href: '/dashboard/tracking',
    icon: FiMapPin,
  },
  {
    id: 'profile',
    label: 'profile', // Traduzido via t('menu.profile')
    href: '/dashboard/profile',
    icon: FiUser,
  },
  {
    id: 'help',
    label: 'help', // Traduzido via t('menu.help')
    href: '/dashboard/help',
    icon: FiHelpCircle,
  },
];

export function isDashboardMenuItemActive(itemHref: string, currentPath: string): boolean {
  if (itemHref === '/dashboard' && currentPath === '/dashboard') {
    return true;
  }
  
  if (itemHref !== '/dashboard' && currentPath.startsWith(itemHref)) {
    return true;
  }
  
  return false;
}

export function getDashboardMenuItems(): DashboardMenuItem[] {
  return dashboardMenuItems;
}