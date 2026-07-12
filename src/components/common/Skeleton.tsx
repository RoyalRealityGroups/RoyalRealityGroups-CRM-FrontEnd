import React from 'react';
import { Skeleton as MuiSkeleton, Box } from '@mui/material';
import type { SkeletonProps as MuiSkeletonProps } from '@mui/material';

export interface SkeletonProps extends MuiSkeletonProps {
  /**
   * Skeleton variant
   * @default 'text'
   */
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  
  /**
   * Width of skeleton
   */
  width?: number | string;
  
  /**
   * Height of skeleton
   */
  height?: number | string;
  
  /**
   * Number of lines (for text variant)
   */
  lines?: number;
}

/**
 * Skeleton component for loading states
 * 
 * Shows placeholder content while data is loading
 * 
 * @example
 * ```tsx
 * // Text skeleton
 * <Skeleton variant="text" width="80%" />
 * 
 * // Multiple lines
 * <Skeleton variant="text" lines={3} />
 * 
 * // Rectangle (for images, cards)
 * <Skeleton variant="rectangular" width={200} height={150} />
 * 
 * // Circle (for avatars)
 * <Skeleton variant="circular" width={40} height={40} />
 * 
 * // Rounded rectangle
 * <Skeleton variant="rounded" width={200} height={100} />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  ...props
}) => {
  // Multiple text lines
  if (variant === 'text' && lines > 1) {
    return (
      <Box>
        {Array.from({ length: lines }).map((_, index) => (
          <MuiSkeleton
            key={index}
            variant="text"
            width={index === lines - 1 ? '60%' : '100%'}
            {...props}
          />
        ))}
      </Box>
    );
  }

  return (
    <MuiSkeleton
      variant={variant}
      width={width}
      height={height}
      {...props}
    />
  );
};

/**
 * Pre-built skeleton layouts for common use cases
 */
export const SkeletonLayouts = {
  /**
   * Card skeleton with image and text
   */
  Card: ({ imageHeight = 200 }: { imageHeight?: number }) => (
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="rectangular" width="100%" height={imageHeight} />
      <Box sx={{ pt: 2 }}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" lines={2} />
      </Box>
    </Box>
  ),

  /**
   * List item skeleton with avatar and text
   */
  ListItem: () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
      </Box>
    </Box>
  ),

  /**
   * Table row skeleton
   */
  TableRow: ({ columns = 4 }: { columns?: number }) => (
    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} variant="text" width={`${100 / columns}%`} />
      ))}
    </Box>
  ),

  /**
   * Profile skeleton with avatar and details
   */
  Profile: () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Skeleton variant="circular" width={80} height={80} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="50%" height={32} />
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="60%" />
      </Box>
    </Box>
  ),

  /**
   * Form field skeleton
   */
  FormField: () => (
    <Box sx={{ mb: 2 }}>
      <Skeleton variant="text" width="30%" height={20} />
      <Skeleton variant="rectangular" width="100%" height={40} />
    </Box>
  ),
};

export default Skeleton;
