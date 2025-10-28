import { ReactNode } from "react";

export interface PublicMenuItem {
  id: string;
  href: string;
  translationKey: string;
  /**
   * Define se o item deve abrir em uma nova aba. Useful para links externos.
   */
  external?: boolean;
  /** Permite adicionar ícones ou elementos extras futuramente */
  icon?: ReactNode;
}

export const PUBLIC_MENU_ITEMS: PublicMenuItem[] = [
  {
    id: "home",
    href: "/",
    translationKey: "navigation.home",
  },
  {
    id: "drivers",
    href: "/drivers",
    translationKey: "navigation.drivers",
  },
  {
    id: "about",
    href: "/about",
    translationKey: "navigation.about",
  },
  {
    id: "contact",
    href: "/contact",
    translationKey: "navigation.contact",
  },
];

export const getPublicMenuItems = () => PUBLIC_MENU_ITEMS;

