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
 * - MainMenu: Botões no topo (desktop)
 * - Dropdown "Mais": Itens secundários
 * - Mobile: Todos aparecem no dropdown do usuário
 */
export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
    {
        id: 'dashboard',
        label: 'Administração',
        href: '/admin',
        icon: FiHome,
        description: 'Visão geral do sistema',
        showInMainMenu: true,
    },
    {
        id: 'requests',
        label: 'Solicitações',
        href: '/admin/requests',
        icon: FiFileText,
        description: 'Pedidos de motoristas',
        showInMainMenu: true,
    },
    {
        id: 'control',
        label: 'Controle',
        href: '/admin/weekly',
        icon: FiCalendar,
        description: 'Controle semanal de ganhos',
        showInMainMenu: true,
    },
    {
        id: 'drivers',
        label: 'Motoristas',
        href: '/admin/drivers',
        icon: FiUsers,
        description: 'Gestão de motoristas e integrações',
        showInMainMenu: true,
    },
    {
        id: 'fleet',
        label: 'Frota',
        href: '/admin/fleet',
        icon: FiTruck,
        description: 'Gestão de frota e motoristas',
        showInMainMenu: true,
    },
    {
        id: 'monitor',
        label: 'Monitor',
        href: '/admin/monitor',
        icon: FiActivity,
        description: 'Rastreamento em tempo real',
        showInMainMenu: true,
    },
    {
        id: 'metrics',
        label: 'Métricas',
        href: '/admin/metrics',
        icon: FiBarChart2,
        description: 'Análise de performance',
        showInMainMenu: false, // Fica no dropdown "Mais"
    },
    {
        id: 'integrations',
        label: 'Integrações',
        href: '/admin/integrations',
        icon: FiSettings,
        description: 'Gerenciar integrações',
        showInMainMenu: false, // Fica no dropdown "Mais"
    },
    {
        id: 'users',
        label: 'Usuários',
        href: '/admin/users',
        icon: FiUsers,
        description: 'Gerenciar usuários',
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
