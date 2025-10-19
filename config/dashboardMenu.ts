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
  FiUsers,
  FiTarget,
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
    label: 'dashboard',
    href: '/dashboard',
    icon: FiHome,
  },
  {
    id: 'data',
    label: 'data',
    href: '/dashboard/data',
    icon: FiUser,
  },
  {
    id: 'payslips',
    label: 'payslips',
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
    label: 'financing',
    href: '/dashboard/financing',
    icon: FiDollarSign,
  },
  {
    id: 'commissions',
    label: 'commissions',
    href: '/dashboard/commissions',
    icon: FiDollarSign,
  },
  {
    id: 'recruitment',
    label: 'recruitment',
    href: '/dashboard/recruitment',
    icon: FiUsers,
  },
  {
    id: 'performance',
    label: 'performance',
    href: '/dashboard/performance',
    icon: FiBarChart,
  },
  {
    id: 'goals',
    label: 'goals',
    href: '/dashboard/goals',
    icon: FiTarget,
  },
  {
    id: 'tracking',
    label: 'tracking',
    href: '/dashboard/tracking',
    icon: FiMapPin,
  },
  {
    id: 'profile',
    label: 'profile',
    href: '/dashboard/profile',
    icon: FiUser,
  },
  {
    id: 'help',
    label: 'help',
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

