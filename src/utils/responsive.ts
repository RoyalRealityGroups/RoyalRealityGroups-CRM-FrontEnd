/**
 * Responsive utility functions and constants
 */

export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const TOUCH_TARGET_SIZE = 44;

/**
 * Check if current viewport is mobile
 */
export const isMobileViewport = (): boolean => {
  return window.innerWidth < BREAKPOINTS.md;
};

/**
 * Check if current viewport is tablet
 */
export const isTabletViewport = (): boolean => {
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
};

/**
 * Check if current viewport is desktop
 */
export const isDesktopViewport = (): boolean => {
  return window.innerWidth >= BREAKPOINTS.lg;
};

/**
 * Get current orientation
 */
export const getOrientation = (): 'portrait' | 'landscape' => {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get device pixel ratio
 */
export const getDevicePixelRatio = (): number => {
  return window.devicePixelRatio || 1;
};

/**
 * Format number for mobile display (shorter format)
 */
export const formatNumberForMobile = (num: number, isMobile: boolean): string => {
  if (!isMobile) return num.toLocaleString();
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Truncate text for mobile display
 */
export const truncateForMobile = (text: string, maxLength: number = 20): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Get responsive font size
 */
export const getResponsiveFontSize = (
  base: number,
  scale: { mobile?: number; tablet?: number; desktop?: number } = {}
): string => {
  const { mobile = 0.875, tablet = 0.9375, desktop = 1 } = scale;
  
  return `clamp(${base * mobile}rem, ${base * tablet}rem, ${base * desktop}rem)`;
};

/**
 * Get responsive spacing
 */
export const getResponsiveSpacing = (
  base: number,
  scale: { mobile?: number; tablet?: number; desktop?: number } = {}
): string => {
  const { mobile = 0.5, tablet = 0.75, desktop = 1 } = scale;
  
  return `clamp(${base * mobile}rem, ${base * tablet}rem, ${base * desktop}rem)`;
};

/**
 * Debounce resize events
 */
export const debounceResize = (callback: () => void, delay: number = 250): (() => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  const debouncedFn = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
  
  return debouncedFn;
};

/**
 * Add orientation change listener
 */
export const addOrientationChangeListener = (callback: (orientation: 'portrait' | 'landscape') => void): (() => void) => {
  const handleOrientationChange = () => {
    callback(getOrientation());
  };
  
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);
  
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
};

/**
 * Responsive image loading
 */
export const getResponsiveImageSrc = (
  baseSrc: string,
  sizes: { mobile?: string; tablet?: string; desktop?: string } = {}
): string => {
  const width = window.innerWidth;
  
  if (width < BREAKPOINTS.md && sizes.mobile) {
    return sizes.mobile;
  }
  if (width < BREAKPOINTS.lg && sizes.tablet) {
    return sizes.tablet;
  }
  if (sizes.desktop) {
    return sizes.desktop;
  }
  
  return baseSrc;
};

/**
 * Check if landscape mode on mobile
 */
export const isMobileLandscape = (): boolean => {
  return isMobileViewport() && getOrientation() === 'landscape';
};

/**
 * Get safe area insets (for notched devices)
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0'),
    right: parseInt(style.getPropertyValue('--sar') || '0'),
    bottom: parseInt(style.getPropertyValue('--sab') || '0'),
    left: parseInt(style.getPropertyValue('--sal') || '0'),
  };
};
