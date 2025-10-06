import { IconType } from 'react-icons';
import {
  FiHome,
  FiUser,
  FiFileText,
  FiMapPin,
  FiHelpCircle,
  FiBarChart,
} from 'react-icons/fi';

export interface DashboardMenuItem {
  id: string;
  label: string;
  href: string;
  icon: IconType;
}

export const dashboardMenuItems: DashboardMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: FiHome,
  },
  {
    id: 'data',
    label: 'My Data',
    href: '/dashboard/data',
    icon: FiUser,
  },
  {
    id: 'payslips',
    label: 'Payslips',
    href: '/dashboard/payslips',
    icon: FiFileText,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: FiBarChart,
  },
  {
    id: 'tracking',
    label: 'Tracking',
    href: '/dashboard/tracking',
    icon: FiMapPin,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/dashboard/profile',
    icon: FiUser,
  },
  {
    id: 'help',
    label: 'Help',
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