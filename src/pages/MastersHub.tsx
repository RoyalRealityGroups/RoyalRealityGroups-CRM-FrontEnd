import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Typography,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Avatar,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
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
  Business as BusinessIcon,
  LocalShipping as LocalShippingIcon,
  Storefront as StorefrontIcon,
  BrandingWatermark as BrandingWatermarkIcon,
  Percent as PercentIcon,
  GridView as GridViewIcon,
  Tune as TuneIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../store/hooks';
import { useMenu } from '../hooks/useMenu';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { usePageTitle } from '../hooks';
import { isSuperuser } from '../utils/permissions';
import type { MenuItemDetail } from '../types/menu.types';
import apiClient from '../api/axios.config';
import SvgIcon from '../components/common/SvgIcon';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../utils/spacing';

type ViewMode = 'square' | 'rectangle' | 'list';

interface ChannelConfig {
  enable_superstockist: boolean;
  enable_distributor: boolean;
  enable_retailer: boolean;
}

const MastersHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { menus, isLoading } = useMenu();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [viewMode, setViewMode] = useState<ViewMode>('rectangle');

  usePageTitle('Masters');

  // Fetch channel configuration
  const { data: channelConfig } = useQuery<ChannelConfig>({
    queryKey: ['channelConfig'],
    queryFn: async () => {
      const response = await apiClient.get('/api/masters/channel-config/');
      return {
        enable_superstockist: response.data.enable_superstockist || false,
        enable_distributor: response.data.enable_distributor || false,
        enable_retailer: response.data.enable_retailer || false,
      };
    },
  });

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters' },
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
      return <SvgIcon src={normalizedIconName} size={fontSize} />;
    }
    
    const iconMap: Record<string, React.ReactElement> = {
      dashboard: <DashboardIcon sx={{ fontSize }} />,
      public: <PublicIcon sx={{ fontSize }} />,
      map: <MapIcon sx={{ fontSize }} />,
      location_city: <LocationCityIcon sx={{ fontSize }} />,
      place: <PlaceIcon sx={{ fontSize }} />,
      warehouse: <WarehouseIcon sx={{ fontSize }} />,
      straighten: <StraightenIcon sx={{ fontSize }} />,
      inventory_2: <Inventory2Icon sx={{ fontSize }} />,
      category: <CategoryIcon sx={{ fontSize }} />,
      account_balance: <AccountBalanceIcon sx={{ fontSize }} />,
      account_tree: <AccountTreeIcon sx={{ fontSize }} />,
      view_carousel: <ViewCarouselIcon sx={{ fontSize }} />,
      business: <BusinessIcon sx={{ fontSize }} />,
      local_shipping: <LocalShippingIcon sx={{ fontSize }} />,
      storefront: <StorefrontIcon sx={{ fontSize }} />,
      branding_watermark: <BrandingWatermarkIcon sx={{ fontSize }} />,
      percent: <PercentIcon sx={{ fontSize }} />,
      grid_view: <GridViewIcon sx={{ fontSize }} />,
      tune: <TuneIcon sx={{ fontSize }} />,
    };
    
    return iconMap[normalizedIconName?.toLowerCase() || ''] || <BusinessIcon sx={{ fontSize }} />;
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

  // Check if menu item is enabled based on channel configuration
  const isMenuItemEnabled = (menuitem: MenuItemDetail): boolean => {
    if (!channelConfig) return true; // Show all if config not loaded yet
    
    const path = menuitem.path.toLowerCase();
    
    // Check for channel partner masters
    if (path.includes('superstockist')) {
      return channelConfig.enable_superstockist;
    }
    if (path.includes('distributor')) {
      return channelConfig.enable_distributor;
    }
    if (path.includes('retailer')) {
      return channelConfig.enable_retailer;
    }
    
    // All other menu items are always enabled
    return true;
  };

  // Get menu items for Masters submenu
  const mastersMenuItems: MenuItemDetail[] = React.useMemo(() => {
    if (!menus) return [];
    
    const items: MenuItemDetail[] = [];
    
    // Find Masters submenu in all menus
    menus.forEach((menu) => {
      // Backend returns 'submenus' (plural)
      const menuSubmenus = menu.submenus || menu.submenu || [];
      
      if (menuSubmenus.length > 0) {
        menuSubmenus.forEach((submenu) => {
          if (submenu.name.toLowerCase() === 'masters' && submenu.menuitems) {
            submenu.menuitems.forEach((menuitem) => {
              // Check both permission and channel configuration
              if (hasAccessToMenuItem(menuitem) && isMenuItemEnabled(menuitem)) {
                items.push(menuitem);
              }
            });
          }
        });
      }
    });
    
    // Sort alphabetically by name
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [menus, user, channelConfig]);

  const handleCardClick = (path: string) => {
    // Handle special routes mapping from backend to frontend
    if (path === '/masters/countries') {
      navigate('/masters/country');
    } else if (path === '/masters/states') {
      navigate('/masters/state');
    } else if (path === '/masters/cities') {
      navigate('/masters/city');
    } else if (path === '/masters/uoms') {
      navigate('/masters/uom');
    } else {
      navigate(path);
    }
  };

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newViewMode: ViewMode | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // Render Square View (Existing)
  const renderSquareView = () => (
    <Grid container spacing={3}>
      {mastersMenuItems.map((menuitem) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={menuitem.id}>
          <Card
            sx={{
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardActionArea
              onClick={() => handleCardClick(menuitem.path)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
              }}
            >
              <CardContent sx={{ textAlign: 'center', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {getIcon(menuitem.icon)}
                </Box>
                <Typography variant="h6" component="div" gutterBottom>
                  {menuitem.name}
                </Typography>
                {menuitem.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {menuitem.description}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Render Rectangle View
  const renderRectangleView = () => (
    <Grid container spacing={2}>
      {mastersMenuItems.map((menuitem) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={menuitem.id}>
          <Card
            sx={{
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateX(4px)',
                boxShadow: 4,
              },
            }}
          >
            <CardActionArea onClick={() => handleCardClick(menuitem.path)}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ml: 2 }}>
                  {getIcon(menuitem.icon, 'large')}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" component="div">
                    {menuitem.name}
                  </Typography>
                </Box>
                <ArrowForwardIcon color="action" sx={{ mr: 2 }} />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Render List View
  const renderListView = () => (
    <Paper elevation={1}>
      {mastersMenuItems.map((menuitem, index) => (
        <React.Fragment key={menuitem.id}>
          <CardActionArea
            onClick={() => handleCardClick(menuitem.path)}
            sx={{
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getIcon(menuitem.icon, 'medium')}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
                  {menuitem.name}
                </Typography>
                {menuitem.description && (
                  <Typography variant="body2" color="text.secondary">
                    {menuitem.description}
                  </Typography>
                )}
              </Box>
              <Chip
                label="View"
                color="primary"
                variant="outlined"
                icon={<ArrowForwardIcon />}
                sx={{ px: 1 }}
              />
            </Box>
          </CardActionArea>
          {index < mastersMenuItems.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </Paper>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Fixed Header */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {/* Left: Back Icon and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* <IconButton 
              onClick={() => navigate('/')}
              size="small"
              sx={{ 
                color: 'primary.main',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ArrowBackIcon />
            </IconButton> */}
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Masters
            </Typography>
          </Box>
          
          {/* Right: View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            size="small"
            sx={{
              '& .MuiToggleButton-root.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            }}
          >
            <ToggleButton value="rectangle" aria-label="rectangle view">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="square" aria-label="square view">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={getContentSectionStyles()}>
        {/* Masters Content */}
        {mastersMenuItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No masters available
            </Typography>
          </Box>
        ) : (
          <>
            {viewMode === 'square' && renderSquareView()}
            {viewMode === 'rectangle' && renderRectangleView()}
            {viewMode === 'list' && renderListView()}
          </>
        )}
      </Box>
    </Box>
  );
};

export default MastersHub;
