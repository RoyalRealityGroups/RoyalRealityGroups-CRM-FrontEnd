import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
  isLargeMobile: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
  width: number;
  height: number;
}

/**
 * Custom hook for responsive design detection
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, isTablet, isDesktop } = useResponsive();
 *   
 *   return (
 *     <Box>
 *       {isMobile && <MobileView />}
 *       {isTablet && <TabletView />}
 *       {isDesktop && <DesktopView />}
 *     </Box>
 *   );
 * }
 * ```
 */
export const useResponsive = (): ResponsiveState => {
  const theme = useTheme();
  
  // MUI breakpoint queries
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isLargeMobile = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Orientation and dimensions
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isPortrait: window.innerHeight > window.innerWidth,
    isLandscape: window.innerWidth >= window.innerHeight,
  });
  
  // Touch device detection
  const [isTouchDevice] = useState(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });
  
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        isPortrait: window.innerHeight > window.innerWidth,
        isLandscape: window.innerWidth >= window.innerHeight,
      });
    };
    
    const handleOrientationChange = () => {
      // Delay to get accurate dimensions after orientation change
      setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isLargeMobile,
    isPortrait: dimensions.isPortrait,
    isLandscape: dimensions.isLandscape,
    isTouchDevice,
    width: dimensions.width,
    height: dimensions.height,
  };
};

export default useResponsive;
