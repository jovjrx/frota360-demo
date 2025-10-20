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
    FiCheckCircle,
    FiChevronDown,
} from 'react-icons/fi';

export interface AdminMenuItem {
    id: string;
    label: string;
    href?: string;
    icon: any;
    description?: string;
    section?: string;
    showInMainMenu?: boolean;
    submenu?: AdminMenuItem[]; // Para itens com submenu
    isSubmenu?: boolean; // Indica se é um item de submenu
}

/**
 * Configuração centralizada do menu admin com submenus agrupados por seção
 * 
 * Estrutura:
 * - MAIN: Dashboard
 * - OPERATIONS: Motoristas, Requisições, Usuários
 * - FINANCIAL: Comissões, Pagamentos, Metas, Reserva Técnica
 * - MONITORING: Performance (KPIs), Rastreamento, Monitoramento
 * - SETTINGS: Integrações, Dados, Contratos
 */
export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
    // ========== DASHBOARD ==========
    {
        id: 'dashboard',
        label: 'dashboard',
        href: '/admin',
        icon: FiHome,
        description: 'overview',
        section: 'MAIN',
        showInMainMenu: true,
    },

    // ========== OPERAÇÕES ==========
    {
        id: 'operations',
        label: 'operations',
        icon: FiUsers,
        description: 'operations_management',
        section: 'OPERATIONS',
        showInMainMenu: true,
        submenu: [
            {
                id: 'drivers',
                label: 'drivers',
                href: '/admin/drivers',
                icon: FiUsers,
                description: 'drivers_management',
                isSubmenu: true,
            },
            {
                id: 'requests',
                label: 'requests',
                href: '/admin/drivers',
                icon: FiCheckCircle,
                description: 'requests_management',
                isSubmenu: true,
            },
            {
                id: 'users',
                label: 'users',
                href: '/admin/users',
                icon: FiUsers,
                description: 'user_management',
                isSubmenu: true,
            },
        ],
    },

    // ========== FINANCEIRO ==========
    {
        id: 'financial',
        label: 'financial',
        icon: FiDollarSign,
        description: 'financial_management',
        section: 'FINANCIAL',
        showInMainMenu: true,
        submenu: [
            {
                id: 'payments',
                label: 'payments',
                href: '/admin/weekly',
                icon: FiCalendar,
                description: 'payments_control',
                isSubmenu: true,
            },
            {
                id: 'commissions',
                label: 'commissions',
                href: '/admin/commissions',
                icon: FiDollarSign,
                description: 'commissions_management',
                isSubmenu: true,
            },

            {
                id: 'goals',
                label: 'goals',
                href: '/admin/goals',
                icon: FiTarget,
                description: 'goals_management',
                isSubmenu: true,
            },
            {
                id: 'technical_reserve',
                label: 'technical_reserve',
                href: '/admin/technical-reserve',
                icon: FiActivity,
                description: 'technical_reserve_management',
                isSubmenu: true,
            },
        ],
    },

    // ========== MONITORAMENTO ==========
    {
        id: 'monitoring',
        label: 'monitoring',
        icon: FiBarChart2,
        description: 'monitoring_management',
        section: 'MONITORING',
        showInMainMenu: false,
        submenu: [
            {
                id: 'performance',
                label: 'performance',
                href: '/admin/kpis',
                icon: FiTrendingUp,
                description: 'performance_management',
                isSubmenu: true,
            },
            {
                id: 'tracking',
                label: 'tracking',
                href: '/admin/monitor',
                icon: FiTruck,
                description: 'vehicle_tracking',
                isSubmenu: true,
            },
            {
                id: 'weekly_monitoring',
                label: 'weekly_monitoring',
                href: '/admin/financing',
                icon: FiBarChart2,
                description: 'weekly_monitoring',
                isSubmenu: true,
            },
        ],
    },

    // ========== CONFIGURAÇÕES ==========
    {
        id: 'settings',
        label: 'settings',
        icon: FiSettings,
        description: 'settings_management',
        section: 'SETTINGS',
        showInMainMenu: false,
        submenu: [
            {
                id: 'integrations',
                label: 'integrations',
                href: '/admin/data',
                icon: FiSettings,
                description: 'integrations_management',
                isSubmenu: true,
            },
            {
                id: 'data',
                label: 'data',
                href: '/admin/data',
                icon: FiBarChart2,
                description: 'weekly_data',
                isSubmenu: true,
            },
            {
                id: 'contracts',
                label: 'contracts',
                href: '/admin/contracts',
                icon: FiFileText,
                description: 'contracts_management',
                isSubmenu: true,
            },
        ],
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
    return ADMIN_MENU_ITEMS.filter(item => !item.showInMainMenu && !item.isSubmenu);
};

/**
 * Retorna todos os itens
 */
export const getAllMenuItems = () => {
    return ADMIN_MENU_ITEMS;
};

/**
 * Retorna itens agrupados por seção
 */
export const getMenuItemsBySection = () => {
    const grouped: { [key: string]: AdminMenuItem[] } = {};

    ADMIN_MENU_ITEMS.forEach(item => {
        const section = item.section || 'OTHER';
        if (!grouped[section]) {
            grouped[section] = [];
        }
        grouped[section].push(item);
    });

    return grouped;
};

/**
 * Verifica se a rota está ativa
 */
export const isMenuItemActive = (itemHref: string | undefined, currentPath: string): boolean => {
    if (!itemHref) return false;
    if (itemHref === '/admin') {
        return currentPath === '/admin';
    }
    return currentPath.startsWith(itemHref);
};

/**
 * Encontra um item de menu por ID
 */
export const findMenuItemById = (id: string): AdminMenuItem | undefined => {
    for (const item of ADMIN_MENU_ITEMS) {
        if (item.id === id) return item;
        if (item.submenu) {
            const found = item.submenu.find(sub => sub.id === id);
            if (found) return found;
        }
    }
    return undefined;
};

/**
 * Verifica se um item tem submenu
 */
export const hasSubmenu = (item: AdminMenuItem): boolean => {
    return !!(item.submenu && item.submenu.length > 0);
};

