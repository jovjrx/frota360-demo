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
} from 'react-icons/fi';

export interface AdminMenuItem {
    id: string;
    label: string;
    href: string;
    icon: any;
    description?: string;
    section?: string; // Agrupamento por seção
    /** Se true, aparece no menu principal. Se false, fica apenas no dropdown "Mais" */
    showInMainMenu?: boolean;
}

/**
 * Configuração centralizada do menu admin com agrupamento por seção
 * Os labels são chaves de tradução que serão traduzidas no componente
 * usando: t(`menu.${item.id}`)
 * 
 * Seções:
 * - MAIN: Dashboard
 * - OPERATIONS: Motoristas, Requisições, Usuários
 * - FINANCIAL: Comissões, Pagamentos, Metas, Reserva Técnica
 * - MONITORING: Performance (KPIs), Rastreamento, Monitoramento
 * - SETTINGS: Integrações, Dados
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
        id: 'drivers',
        label: 'drivers',
        href: '/admin/drivers',
        icon: FiUsers,
        description: 'drivers_management',
        section: 'OPERATIONS',
        showInMainMenu: true,
    },
    {
        id: 'requests',
        label: 'requests',
        href: '/admin/drivers',
        icon: FiCheckCircle,
        description: 'requests_management',
        section: 'OPERATIONS',
        showInMainMenu: false,
    },
    {
        id: 'users',
        label: 'users',
        href: '/admin/users',
        icon: FiUsers,
        description: 'user_management',
        section: 'OPERATIONS',
        showInMainMenu: false,
    },

    // ========== FINANCEIRO ==========
    {
        id: 'commissions',
        label: 'commissions',
        href: '/admin/commissions',
        icon: FiDollarSign,
        description: 'commissions_management',
        section: 'FINANCIAL',
        showInMainMenu: false,
    },
    {
        id: 'control',
        label: 'payments',
        href: '/admin/weekly',
        icon: FiCalendar,
        description: 'payments_control',
        section: 'FINANCIAL',
        showInMainMenu: true,
    },
    {
        id: 'goals',
        label: 'goals',
        href: '/admin/goals',
        icon: FiTarget,
        description: 'goals_management',
        section: 'FINANCIAL',
        showInMainMenu: false,
    },
    {
        id: 'technical_reserve',
        label: 'technical_reserve',
        href: '/admin/technical-reserve',
        icon: FiActivity,
        description: 'technical_reserve_management',
        section: 'FINANCIAL',
        showInMainMenu: false,
    },

    // ========== MONITORAMENTO ==========
    {
        id: 'kpis',
        label: 'performance',
        href: '/admin/kpis',
        icon: FiTrendingUp,
        description: 'performance_management',
        section: 'MONITORING',
        showInMainMenu: false,
    },
    {
        id: 'monitor',
        label: 'tracking',
        href: '/admin/monitor',
        icon: FiTruck,
        description: 'vehicle_tracking',
        section: 'MONITORING',
        showInMainMenu: false,
    },
    {
        id: 'financing',
        label: 'monitoring',
        href: '/admin/financing',
        icon: FiBarChart2,
        description: 'weekly_monitoring',
        section: 'MONITORING',
        showInMainMenu: false,
    },

    // ========== CONFIGURAÇÕES ==========
    {
        id: 'integrations',
        label: 'integrations',
        href: '/admin/data',
        icon: FiSettings,
        description: 'integrations_management',
        section: 'SETTINGS',
        showInMainMenu: false,
    },
    {
        id: 'data',
        label: 'data',
        href: '/admin/data',
        icon: FiBarChart2,
        description: 'weekly_data',
        section: 'SETTINGS',
        showInMainMenu: false,
    },
    {
        id: 'contracts',
        label: 'contracts',
        href: '/admin/contracts',
        icon: FiFileText,
        description: 'contracts_management',
        section: 'SETTINGS',
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
 * Retorna itens do dropdown "Mais" (desktop) agrupados por seção
 */
export const getMoreMenuItems = () => {
    const moreItems = ADMIN_MENU_ITEMS.filter(item => !item.showInMainMenu);
    return moreItems;
};

/**
 * Retorna todos os itens agrupados por seção
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
export const isMenuItemActive = (itemHref: string, currentPath: string): boolean => {
    if (itemHref === '/admin') {
        return currentPath === '/admin';
    }
    return currentPath.startsWith(itemHref);
};

