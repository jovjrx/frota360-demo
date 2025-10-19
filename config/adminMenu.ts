import {
    FiHome,
    FiFileText,
    FiCalendar,
    FiTruck,
    FiActivity,
    FiSettings,
    FiBarChart2,
    FiUsers,
    FiDollarSign,
    FiTarget,
    FiTrendingUp,
} from 'react-icons/fi';

export interface AdminMenuItem {
    id: string;
    label: string;
    href: string;
    icon: any;
    description?: string;
    /** Se true, aparece no menu principal. Se false, fica apenas no dropdown "Mais" */
    showInMainMenu?: boolean;
}

/**
 * Configuração centralizada do menu admin
 * Os labels são chaves de tradução que serão traduzidas no componente
 * usando: t(`menu.${item.id}`)
 * - MainMenu: Botões no topo (desktop)
 * - Dropdown "Mais": Itens secundários
 * - Mobile: Todos aparecem no dropdown do usuário
 */
export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
    {
        id: 'dashboard',
        label: 'dashboard',
        href: '/admin',
        icon: FiHome,
        description: 'overview',
        showInMainMenu: true,
    },
    {
        id: 'drivers',
        label: 'drivers',
        href: '/admin/drivers',
        icon: FiUsers,
        description: 'drivers_management',
        showInMainMenu: true,
    },
    {
        id: 'control',
        label: 'control',
        href: '/admin/weekly',
        icon: FiCalendar,
        description: 'weekly_control',
        showInMainMenu: true,
    },
    {
        id: 'financing',
        label: 'financing',
        href: '/admin/financing',
        icon: FiActivity,
        description: 'financing_management',
        showInMainMenu: false,
    },
    {
        id: 'contracts',
        label: 'contracts',
        href: '/admin/contracts',
        icon: FiFileText,
        description: 'contracts_management',
        showInMainMenu: false,
    },
    {
        id: 'monitor',
        label: 'monitor',
        href: '/admin/monitor',
        icon: FiTruck,
        description: 'tracking',
        showInMainMenu: false,
    },
    {
        id: 'data',
        label: 'data',
        href: '/admin/data',
        icon: FiBarChart2,
        description: 'weekly_data',
        showInMainMenu: false,
    },
    {
        id: 'commissions',
        label: 'commissions',
        href: '/admin/commissions',
        icon: FiDollarSign,
        description: 'commissions_management',
        showInMainMenu: false,
    },
    {
        id: 'kpis',
        label: 'kpis',
        href: '/admin/kpis',
        icon: FiTrendingUp,
        description: 'kpis_management',
        showInMainMenu: false,
    },
    {
        id: 'goals',
        label: 'goals',
        href: '/admin/goals',
        icon: FiTarget,
        description: 'goals_management',
        showInMainMenu: false,
    },
    {
        id: 'technical_reserve',
        label: 'technical_reserve',
        href: '/admin/technical-reserve',
        icon: FiActivity,
        description: 'technical_reserve_management',
        showInMainMenu: false,
    },
    {
        id: 'users',
        label: 'users',
        href: '/admin/users',
        icon: FiUsers,
        description: 'user_management',
        showInMainMenu: false,
    },
];

/**
 * Retorna itens do menu principal (desktop)
 */
export const getMainMenuItems = () => {
    return ADMIN_MENU_ITEMS.filter(item => item.showInMainMenu);
};

/**
 * Retorna itens do dropdown "Mais" (desktop)
 */
export const getMoreMenuItems = () => {
    return ADMIN_MENU_ITEMS.filter(item => !item.showInMainMenu);
};

/**
 * Retorna todos os itens (mobile dropdown)
 */
export const getAllMenuItems = () => {
    return ADMIN_MENU_ITEMS;
};

/**
 * Verifica se a rota está ativa
 */
export const isMenuItemActive = (itemHref: string, currentPath: string): boolean => {
    if (itemHref === '/admin') {
        return currentPath === '/admin';
    }
    return currentPath.startsWith(itemHref);
};

