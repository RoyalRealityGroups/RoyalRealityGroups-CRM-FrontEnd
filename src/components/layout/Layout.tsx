import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AppBar from './AppBar';
import Sidebar from './Sidebar';
import BreadcrumbBar from './BreadcrumbBar';
import { BreadcrumbProvider } from '../../contexts/BreadcrumbContext';
import { usePrefetchCommonData } from '../../hooks/usePrefetchCommonData';
import { usePermissions } from '../../hooks/usePermissions';

const DRAWER_WIDTH = 240;
const MINI_DRAWER_WIDTH = 60;

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  // Prefetch common data used across forms
  usePrefetchCommonData();

  // Fetch fresh permissions on every route change
  usePermissions();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) {
      setSidebarCollapsed(true);
    }
  }, [isTablet]);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  return (
    <BreadcrumbProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <AppBar onMenuClick={handleDrawerToggle} />
        
        <Sidebar 
          collapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onToggle={handleDrawerToggle}
          onMobileClose={handleMobileClose}
          width={DRAWER_WIDTH}
          miniWidth={MINI_DRAWER_WIDTH}
          isMobile={isMobile}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            marginTop: { xs: '60px', sm: '68px' },
            backgroundColor: '#F4F6F8',
            height: { xs: 'calc(100vh - 60px)', sm: 'calc(100vh - 68px)' },
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <BreadcrumbBar />
          <Box sx={{ 
            position: 'relative', 
            zIndex: 1,
            flexGrow: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 0.5, sm: 0.75, md: 1 },
          }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </BreadcrumbProvider>
  );
};

export default Layout;
