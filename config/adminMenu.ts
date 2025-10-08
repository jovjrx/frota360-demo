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
        description: 'Visão geral',
        showInMainMenu: true,
    },
    {
        id: 'requests',
        label: 'Solicitações',
        href: '/admin/requests',
        icon: FiFileText,
        description: 'Solicitações',
        showInMainMenu: true,
    },
    {
        id: 'drivers',
        label: 'Motoristas',
        href: '/admin/drivers',
        icon: FiUsers,
        description: 'Gestão de motoristas',
        showInMainMenu: true,
    },
    {
        id: 'control',
        label: 'Controle & Pagamentos',
        href: '/admin/weekly',
        icon: FiCalendar,
        description: 'Controle semanal',
        showInMainMenu: true,
    },
    {
        id: 'monitor',
        label: 'Monitoramento',
        href: '/admin/monitor',
        icon: FiTruck,
        description: 'Rastreamento',
        showInMainMenu: false, // Movido para "Mais"
    },
    {
        id: 'dados',
        label: 'Dados',
        href: '/admin/data',
        icon: FiBarChart2,
        description: 'Dados semanais',
        showInMainMenu: false, // Fica no dropdown "Mais"
    },
    {
        id: 'users',
        label: 'Usuários',
        href: '/admin/users',
        icon: FiUsers,
        description: 'Gerenciamento de usuários',
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
