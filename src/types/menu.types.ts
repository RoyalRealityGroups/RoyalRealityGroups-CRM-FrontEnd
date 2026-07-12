// Menu Types
export interface MenuItem {
  id: number;
  code: string;
  name: string;
  icon?: string;
  path?: string;
  submenu?: Submenu[];
  submenus?: Submenu[]; // Backend returns 'submenus'
  menuitems?: MenuItemDetail[];
  sequence: number;
  is_active: boolean;
}

export interface Submenu {
  id: number;
  code: string;
  name: string;
  icon?: string;
  menuitems?: MenuItemDetail[];
  sequence: number;
  is_active: boolean;
  click?: string;
  submenus?: Submenu[];
  menu?: number; // FK to Menu
  submenu?: number; // Self-referential FK
}

export interface MenuItemDetail {
  id: number;
  code: string;
  name: string;
  icon?: string;
  path?: string;
  sequence: number;
  is_active: boolean;
  permissions?: string[];
  description?: string;
  link?: string; // Backend might return 'link' instead of 'path'
  menu?: number; // FK to Menu
  submenu?: number; // FK to Submenu
  permission?: number | { id: number; name: string; codename: string }; // FK to Permission
}

export interface UserMenu {
  menus: MenuItem[];
}
