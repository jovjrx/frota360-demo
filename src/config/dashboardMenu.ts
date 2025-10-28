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
  FiGift,
} from 'react-icons/fi';

export interface DashboardMenuItem {
  id: string;
  label: string;
  href?: string;
  icon: IconType;
  subItems?: DashboardMenuItem[];
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
    id: 'payments',
    label: 'payments',
    href: '/dashboard/payments',
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
    id: 'bonus',
    label: 'bonus',
    icon: FiGift,
    subItems: [
      {
        id: 'referral',
        label: 'referral',
        href: '/dashboard/referral',
        icon: FiUsers,
      },
      {
        id: 'goals',
        label: 'goals',
        href: '/dashboard/goals',
        icon: FiTarget,
      },
      {
        id: 'commissions',
        label: 'commissions',
        href: '/dashboard/commissions',
        icon: FiDollarSign,
      },
    ],
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

// Menu item de rastreamento - apenas para locatários
const trackingMenuItem: DashboardMenuItem = {
  id: 'tracking',
  label: 'tracking',
  href: '/dashboard/tracking',
  icon: FiMapPin,
};

export function isDashboardMenuItemActive(itemHref: string | undefined, currentPath: string): boolean {
  if (!itemHref) return false;
  
  if (itemHref === '/dashboard' && currentPath === '/dashboard') {
    return true;
  }
  
  if (itemHref !== '/dashboard' && currentPath.startsWith(itemHref)) {
    return true;
  }
  
  return false;
}

export function isDashboardMenuGroupActive(item: DashboardMenuItem, currentPath: string): boolean {
  if (item.href && isDashboardMenuItemActive(item.href, currentPath)) {
    return true;
  }
  if (item.subItems) {
    return item.subItems.some(subItem => isDashboardMenuItemActive(subItem.href, currentPath));
  }
  return false;
}

export function getDashboardMenuItems(): DashboardMenuItem[] {
  return dashboardMenuItems;
}


