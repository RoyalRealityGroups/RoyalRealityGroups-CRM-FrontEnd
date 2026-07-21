import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Typography,
  Container,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
} from '@mui/material';
import {
  Tune as TuneIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { useMenu } from '../hooks/useMenu';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { usePageTitle } from '../hooks';
import { isSuperuser } from '../utils/permissions';
import type { MenuItemDetail } from '../types/menu.types';
import SvgIcon from '../components/common/SvgIcon';
import { getHubContainerStyles } from '../utils/spacing';

type ViewMode = 'square' | 'rectangle' | 'list';

const SettingsHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { menus, isLoading } = useMenu();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [viewMode, setViewMode] = useState<ViewMode>('rectangle');

  usePageTitle('Settings');

  // Non-superusers go directly to General Settings
  useEffect(() => {
    if (!isLoading && user && !isSuperuser(user)) {
      navigate('/settings/general-settings', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings' },
    ]);

    // Clear breadcrumbs on unmount
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Get icon component based on icon name
  const getIcon = (iconName?: string, size: 'small' | 'medium' | 'large' = 'large'): React.ReactElement => {
    const fontSize = size === 'small' ? 32 : size === 'medium' ? 40 : 48;
    const normalizedIconName = iconName?.trim();
    
    // Check if icon is SVG (from backend media folder)
    if (normalizedIconName?.toLowerCase().endsWith('.svg')) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <SvgIcon src={normalizedIconName} size={fontSize} />
        </Box>
      );
    }
    
    const iconMap: Record<string, React.ReactElement> = {
      settings: <SettingsIcon sx={{ fontSize }} />,
      tune: <TuneIcon sx={{ fontSize }} />,
    };
    
    return iconMap[normalizedIconName?.toLowerCase() || ''] || <SettingsIcon sx={{ fontSize }} />;
  };

  // Check if user has permission to view menu item
  const hasAccessToMenuItem = (menuitem: MenuItemDetail): boolean => {
    // Superuser sees everything
    if (isSuperuser(user)) return true;
    
    // If no permissions defined, show to all
    if (!menuitem.permissions || menuitem.permissions.length === 0) return true;
    
    // Check if user has any of the required permissions
    return menuitem.permissions.some(permission => user?.permissions?.includes(permission));
  };

  // Get menu items for Settings submenu
  const settingsMenuItems: MenuItemDetail[] = React.useMemo(() => {
    if (!menus) return [];
    
    const items: MenuItemDetail[] = [];
    
    // Find Settings submenu in all menus
    menus.forEach((menu) => {
      // Backend returns 'submenus' (plural)
      const menuSubmenus = menu.submenus || menu.submenu || [];
      
      if (menuSubmenus.length > 0) {
        menuSubmenus.forEach((submenu) => {
          if (submenu.name.toLowerCase() === 'settings' && submenu.menuitems) {
            submenu.menuitems.forEach((menuitem) => {
              if (hasAccessToMenuItem(menuitem)) {
                // Non-superusers only see General Settings
                if (!isSuperuser(user)) {
                  if (menuitem.name?.toLowerCase() === 'general settings') {
                    items.push(menuitem);
                  }
                } else {
                  items.push(menuitem);
                }
              }
            });
          }
        });
      }
    });
    
    // Sort by sequence
    return items.sort((a, b) => a.sequence - b.sequence);
  }, [menus, user]);

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newViewMode: ViewMode | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // List view rendering
  const renderListView = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2 } }}>
      {settingsMenuItems.map((item) => (
        <Card 
          key={item.id}
          sx={{ 
            transition: 'all 0.3s ease',
            '&:hover': { 
              transform: { xs: 'none', md: 'translateX(8px)' },
              boxShadow: 4,
            },
          }}
        >
          <CardActionArea onClick={() => item.link && handleCardClick(item.link)}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, p: { xs: 2, md: 3 } }}>
              <Avatar
                sx={{
                  width: { xs: 40, md: 56 },
                  height: { xs: 40, md: 56 },
                  bgcolor: 'primary.main',
                }}
              >
                {getIcon(item.icon, 'medium')}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" component="div" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {item.description || `Manage ${item.name.toLowerCase()} settings`}
                </Typography>
              </Box>
              <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                <ArrowForwardIcon fontSize="large" />
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );

  // Grid view rendering (square or rectangle)
  const renderGridView = () => (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      {settingsMenuItems.map((item) => (
        <Grid 
          size={{ 
            xs: viewMode === 'square' ? 6 : 12, 
            sm: viewMode === 'square' ? 6 : 12, 
            md: viewMode === 'square' ? 4 : 6, 
            lg: viewMode === 'square' ? 3 : 4 
          }}
          key={item.id}
        >
          <Card 
            sx={{ 
              height: viewMode === 'square' ? { xs: 150, md: 200 } : { xs: 120, md: 160 },
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: { xs: 'none', md: 'translateY(-8px)' },
                boxShadow: 6,
              },
            }}
          >
            <CardActionArea 
              onClick={() => item.link && handleCardClick(item.link)}
              sx={{ height: '100%' }}
            >
              <CardContent 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: viewMode === 'square' ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: { xs: 1, md: 2 },
                  p: { xs: 1.5, md: 3 },
                }}
              >
                <Avatar
                  sx={{
                    width: viewMode === 'square' ? { xs: 48, md: 72 } : { xs: 40, md: 56 },
                    height: viewMode === 'square' ? { xs: 48, md: 72 } : { xs: 40, md: 56 },
                    bgcolor: 'primary.main',
                  }}
                >
                  {getIcon(item.icon, viewMode === 'square' ? 'large' : 'medium')}
                </Avatar>
                <Box 
                  sx={{ 
                    textAlign: viewMode === 'square' ? 'center' : 'left',
                    flex: viewMode === 'rectangle' ? 1 : undefined,
                    minWidth: 0,
                  }}
                >
                  <Typography 
                    variant={viewMode === 'square' ? 'h6' : 'h6'} 
                    component="div"
                    gutterBottom={viewMode === 'rectangle'}
                    sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' } }}
                    noWrap={viewMode === 'square'}
                  >
                    {item.name}
                  </Typography>
                  {viewMode === 'rectangle' && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                      {item.description || `Configure ${item.name.toLowerCase()}`}
                    </Typography>
                  )}
                </Box>
                {viewMode === 'rectangle' && (
                  <Box sx={{ color: 'primary.main', display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
                    <ArrowForwardIcon fontSize="large" />
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth={false} sx={{ ...getHubContainerStyles(), height: '100%', overflow: 'auto', pb: 4 }}>
      <Box sx={{ mb: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}>
            Configure application settings and preferences
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value="square" aria-label="square view">
            <ViewModuleIcon />
          </ToggleButton>
          <ToggleButton value="rectangle" aria-label="rectangle view">
            <ViewModule sx={{ transform: 'rotate(90deg)' }} />
          </ToggleButton>
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {settingsMenuItems.length === 0 ? (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            color: 'text.secondary',
          }}
        >
          <SettingsIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" gutterBottom>
            No Settings Available
          </Typography>
          <Typography variant="body2">
            You don't have access to any settings or no settings are configured yet.
          </Typography>
        </Box>
      ) : (
        viewMode === 'list' ? renderListView() : renderGridView()
      )}
    </Container>
  );
};

// Fix: Import ViewModule component properly
const ViewModule = ViewModuleIcon;

export default SettingsHub;
