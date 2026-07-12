import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Tooltip,
  SwipeableDrawer,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Store as StoreIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  ShoppingCart as ShoppingCartIcon,
  Public as PublicIcon,
  Map as MapIcon,
  LocationCity as LocationCityIcon,
  Place as PlaceIcon,
  Warehouse as WarehouseIcon,
  Straighten as StraightenIcon,
  Inventory2 as Inventory2Icon,
  Category as CategoryIcon,
  AccountBalance as AccountBalanceIcon,
  AccountTree as AccountTreeIcon,
  ViewCarousel as ViewCarouselIcon,
  FileUpload as FileUploadIcon,
  History as HistoryIcon,
  CloudUpload as CloudUploadIcon,
  ReceiptLong as ReceiptLongIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useMenu } from '../../hooks/useMenu';
import { isSuperuser } from '../../utils/permissions';
import type { Submenu } from '../../types/menu.types';
import LordIcon from '../common/LordIcon';
import SvgIcon from '../common/SvgIcon';

const checkPermission = (userPermissions: string[], permission: string, user?: { permissions?: string[] }): boolean => {
  const permSet = new Set<string>();
  if (userPermissions && Array.isArray(userPermissions)) {
    userPermissions.forEach(p => { if (typeof p === 'string') permSet.add(p); });
  }
  if (user?.permissions && Array.isArray(user.permissions)) {
    user.permissions.forEach(p => { if (typeof p === 'string') permSet.add(p); });
  }
  if (permSet.size === 0) return false;
  return Array.from(permSet).some(p => {
    if (p === permission) return true;
    if (p.includes('.') && p.split('.')[1] === permission) return true;
    if (permission.includes('.') && p === permission.split('.')[1]) return true;
    return false;
  });
};

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
  width: number;
  miniWidth: number;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  mobileOpen,
  onToggle, 
  onMobileClose,
  width, 
  miniWidth,
  isMobile,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const { permissions: userPermissions } = useAppSelector((state) => state.permissions);
  const { menus, isLoading } = useMenu();
  const [hoveredSubmenu, setHoveredSubmenu] = React.useState<number | null>(null);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      onMobileClose();
    }
  };

  const getIcon = (iconName?: string, submenuId?: number, submenuName?: string): React.ReactElement => {
    const isHovered = hoveredSubmenu === submenuId;
    const normalizedIconName = iconName?.trim();
    const normalizedName = submenuName?.toLowerCase() || normalizedIconName?.toLowerCase() || '';
    
    // SVG icons for Masters submenu items (if icon filename is provided)
    if (normalizedIconName && !normalizedName.includes('dashboard') && 
        !normalizedName.includes('masters') &&
        !normalizedName.includes('import') &&
        !normalizedName.includes('price') &&
        !normalizedName.includes('sales') &&
        !normalizedName.includes('settings') &&
        normalizedIconName.toLowerCase().endsWith('.svg')) {
      return <SvgIcon src={normalizedIconName} alt={submenuName} size={24} />;
    }
    
    // Lords icons for main submenus — Royal Reality palette
    if (normalizedName.includes('dashboard')) {
      return <LordIcon src="https://cdn.lordicon.com/axroojxh.json" trigger="hover" colors="primary:#FFFFFF" size={24} parentHover={isHovered} />;
    }
    if (normalizedName.includes('masters')) {
      return <LordIcon src="https://cdn.lordicon.com/bsmnglum.json" trigger="hover" colors="primary:#FFFFFF,secondary:#FFFFFF" size={24} parentHover={isHovered} />;
    }
    if (normalizedName.includes('import')) {
      return <LordIcon src="https://cdn.lordicon.com/bimokqfw.json" trigger="hover" colors="primary:#FFFFFF" size={24} parentHover={isHovered} />;
    }
    if (normalizedName.includes('price')) {
      return <LordIcon src="https://cdn.lordicon.com/bsdkzyjd.json" trigger="hover" colors="primary:#FFFFFF,secondary:#FFFFFF" size={24} parentHover={isHovered} />;
    }
    if (normalizedName.includes('sales')) {
      return <LordIcon src="https://cdn.lordicon.com/oqhqyeud.json" trigger="hover" colors="primary:#FFFFFF,secondary:#FFFFFF" size={24} parentHover={isHovered} />;
    }
    if (normalizedName.includes('reports')) {
      return <LordIcon src="https://cdn.lordicon.com/gqdnbnwt.json" trigger="hover" colors="primary:#FFFFFF,secondary:#FFFFFF" size={24} parentHover={isHovered} />;
    }
    if (normalizedName.includes('settings')) {
      return <LordIcon src="https://cdn.lordicon.com/asyunleq.json" trigger="hover" colors="primary:#FFFFFF" size={24} parentHover={isHovered} />;
    }

    // Fallback to regular icon map for backward compatibility
    const iconMap: Record<string, React.ReactElement> = {
      people: <PeopleIcon />,
      store: <StoreIcon />,
      business: <BusinessIcon />,
      assessment: <AssessmentIcon />,
      shoppingcart: <ShoppingCartIcon />,
      reports: <AssessmentIcon />,
      users: <PeopleIcon />,
      public: <PublicIcon />,
      map: <MapIcon />,
      location_city: <LocationCityIcon />,
      place: <PlaceIcon />,
      warehouse: <WarehouseIcon />,
      straighten: <StraightenIcon />,
      inventory_2: <Inventory2Icon />,
      category: <CategoryIcon />,
      account_balance: <AccountBalanceIcon />,
      account_tree: <AccountTreeIcon />,
      view_carousel: <ViewCarouselIcon />,
      file_upload: <FileUploadIcon />,
      cloud_upload: <CloudUploadIcon />,
      history: <HistoryIcon />,
      import: <CloudUploadIcon />,
      receipt_long: <ReceiptLongIcon />,
      local_shipping: <LocalShippingIcon />,
      receipt: <ReceiptIcon />,
      verified: <VerifiedIcon />,
    };
    
    return iconMap[normalizedIconName?.toLowerCase() || ''] || <DashboardIcon />;
  };

  const allSubmenus: Submenu[] = React.useMemo(() => {
    if (!menus) return [];
    
    const submenus: Submenu[] = [];
    
    menus.forEach((menu) => {
      const menuSubmenus = menu.submenus || menu.submenu || [];
      
      if (menuSubmenus && menuSubmenus.length > 0) {
        menuSubmenus.forEach((submenu) => {
          if (!submenu.menuitems || submenu.menuitems.length === 0) return;
          if (submenu.name?.toLowerCase() === 'settings') return;

          if (isSuperuser(user)) {
            submenus.push(submenu);
            return;
          }
          
          const hasAccess = submenu.menuitems.some((menuitem) => {
            // Handle permissions as string array
            if (menuitem.permissions && menuitem.permissions.length > 0) {
              return menuitem.permissions.some(p => checkPermission(userPermissions, p, user));
            }
            // Handle permission as object { id, name, codename } or number
            if (menuitem.permission) {
              if (typeof menuitem.permission === 'object' && menuitem.permission.codename) {
                return checkPermission(userPermissions, menuitem.permission.codename, user);
              }
            }
            // No permissions defined — allow access
            return true;
          });
          
          if (hasAccess) {
            submenus.push(submenu);
          }
        });
      }
    });
    
    return submenus.sort((a, b) => a.sequence - b.sequence);
  }, [menus, user, userPermissions]);

  const getSubmenuPath = (submenu: Submenu): string => {
    if (submenu.click) {
      return submenu.click;
    }
    return `/${submenu.name.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const drawerContent = (
    <>
    {/* {!isMobile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            p: 1,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          }}
        >
          <IconButton onClick={onToggle} size="small">
            <MenuIcon />
          </IconButton>
        </Box>
      )} */}
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !allSubmenus || allSubmenus.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              No menu products available
            </Typography>
          </Box>
        ) : (
          <List>
            {allSubmenus.map((submenu) => (
              <ListItem key={submenu.id} disablePadding>
                <Tooltip 
                  title={collapsed && !isMobile ? submenu.name : ''} 
                  placement="right"
                  arrow
                >
                  <ListItemButton 
                    onClick={() => handleNavigate(getSubmenuPath(submenu))}
                    selected={location.pathname === getSubmenuPath(submenu)}
                    onMouseEnter={() => setHoveredSubmenu(submenu.id)}
                    onMouseLeave={() => setHoveredSubmenu(null)}
                    sx={{
                      justifyContent: collapsed && !isMobile ? 'center' : 'initial',
                      px: isMobile ? 2 : (collapsed ? 0 : 2),
                      minHeight: '48px',
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        minWidth: collapsed && !isMobile ? 'auto' : 56,
                        justifyContent: 'center',
                      }}
                    >
                      {getIcon(submenu.icon, submenu.id, submenu.name)}
                    </ListItemIcon>
                    {(!collapsed || isMobile) && (
                      <ListItemText 
                        primary={submenu.name}
                        primaryTypographyProps={{
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </>
  );

  if (isMobile) {
    return (
      <SwipeableDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        onOpen={() => {}}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
'& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          marginTop: '60px',
          height: 'calc(100vh - 60px)',
        },
        }}
      >
        {drawerContent}
      </SwipeableDrawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      open={true}
      sx={{
        width: collapsed ? miniWidth : width,
        flexShrink: 0,
        transition: 'width 0.3s',
        '& .MuiDrawer-paper': {
          width: collapsed ? miniWidth : width,
          boxSizing: 'border-box',
          marginTop: '68px',
          height: 'calc(100vh - 68px)',
          transition: 'width 0.3s',
          overflowX: 'hidden',
          borderRight: '1px solid rgba(249, 180, 1, 0.10)',
          borderRadius: 0,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
