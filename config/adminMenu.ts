import {
    FiHome,
    FiFileText,
    FiCalendar,
    FiTruck,
    FiActivity,
    FiSettings,
    FiBarChart2,
    FiUsers,
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
        label: 'dashboard', // Traduzido via t('menu.dashboard')
        href: '/admin',
        icon: FiHome,
        description: 'overview', // Traduzido via t('menu.overview')
        showInMainMenu: true,
    },
    {
        id: 'requests',
        label: 'requests', // Traduzido via t('menu.requests')
        href: '/admin/requests',
        icon: FiFileText,
        description: 'requests', // Traduzido via t('menu.requests')
        showInMainMenu: true,
    },
    {
        id: 'drivers',
        label: 'drivers', // Traduzido via t('menu.drivers')
        href: '/admin/drivers',
        icon: FiUsers,
        description: 'drivers_management', // Traduzido via t('menu.drivers_management')
        showInMainMenu: true,
    },
    {
        id: 'control',
        label: 'control', // Traduzido via t('menu.control')
        href: '/admin/weekly',
        icon: FiCalendar,
        description: 'weekly_control', // Traduzido via t('menu.weekly_control')
        showInMainMenu: true,
    },
    {
        id: 'financing',
        label: 'financing', // Traduzido via t('menu.financing')
        href: '/admin/financing',
        icon: FiActivity,
        description: 'financing_management', // Traduzido via t('menu.financing_management')
        showInMainMenu: false, // Fica no dropdown "Mais"
    },
    {
        id: 'monitor',
        label: 'monitor', // Traduzido via t('menu.monitor')
        href: '/admin/monitor',
        icon: FiTruck,
        description: 'tracking', // Traduzido via t('menu.tracking')
        showInMainMenu: false, // Movido para "Mais"
    },
    {
        id: 'data',
        label: 'data', // Traduzido via t('menu.data')
        href: '/admin/data',
        icon: FiBarChart2,
        description: 'weekly_data', // Traduzido via t('menu.weekly_data')
        showInMainMenu: false, // Fica no dropdown "Mais"
    },
    {
        id: 'users',
        label: 'users', // Traduzido via t('menu.users')
        href: '/admin/users',
        icon: FiUsers,
        description: 'user_management', // Traduzido via t('menu.user_management')
        showInMainMenu: false, // Fica no dropdown "Mais"
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
