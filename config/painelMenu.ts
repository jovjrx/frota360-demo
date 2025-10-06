import { IconType } from 'react-icons';
import {
  FiHome,
  FiUser,
  FiFileText,
  FiMapPin,
  FiHelpCircle,
} from 'react-icons/fi';

export interface PainelMenuItem {
  id: string;
  label: string;
  href: string;
  icon: IconType;
}

export const painelMenuItems: PainelMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/painel',
    icon: FiHome,
  },
  {
    id: 'dados',
    label: 'Meus Dados',
    href: '/painel/dados',
    icon: FiUser,
  },
  {
    id: 'contracheques',
    label: 'Contracheques',
    href: '/painel/contracheques',
    icon: FiFileText,
  },
  {
    id: 'rastreamento',
    label: 'Rastreamento',
    href: '/painel/rastreamento',
    icon: FiMapPin,
  },
  {
    id: 'ajuda',
    label: 'Ajuda',
    href: '/painel/ajuda',
    icon: FiHelpCircle,
  },
];

export function isPainelMenuItemActive(itemHref: string, currentPath: string): boolean {
  if (itemHref === '/painel') {
    return currentPath === '/painel';
  }
  return currentPath.startsWith(itemHref);
}

export function getPainelMenuItems(): PainelMenuItem[] {
  return painelMenuItems;
}
