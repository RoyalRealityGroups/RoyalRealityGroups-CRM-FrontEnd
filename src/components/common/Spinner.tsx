import React from 'react';
import { CircularProgress, Box, Typography, Backdrop } from '@mui/material';
import type { CircularProgressProps } from '@mui/material';

export interface SpinnerProps extends Omit<CircularProgressProps, 'size'> {
  /**
   * Size of the spinner
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | number;
  
  /**
   * Loading text/label to display
   */
  label?: string;
  
  /**
   * Whether to show as full-screen overlay
   * @default false
   */
  fullScreen?: boolean;
  
  /**
   * Whether to center the spinner
   * @default false
   */
  centered?: boolean;
  
  /**
   * Color variant
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'inherit' | 'success' | 'error' | 'info' | 'warning';
  
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Reusable Spinner/Loading component
 * 
 * Provides consistent loading indicators across the application
 * 
 * @example
 * ```tsx
 * // Basic spinner
 * <Spinner />
 * 
 * // Small spinner
 * <Spinner size="small" />
 * 
 * // With label
 * <Spinner label="Loading..." />
 * 
 * // Centered on page
 * <Spinner centered />
 * 
 * // Full-screen overlay
 * <Spinner fullScreen label="Processing order..." />
 * 
 * // Custom size
 * <Spinner size={60} />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  label,
  fullScreen = false,
  centered = false,
  color = 'primary',
  className,
  ...props
}) => {
  // Map size to pixel values
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60,
  };

  const spinnerSize = typeof size === 'string' ? sizeMap[size] : size;

  const spinner = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
      className={className}
    >
      <CircularProgress
        size={spinnerSize}
        color={color}
        {...props}
      />
      {label && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );

  // Full-screen overlay
  if (fullScreen) {
    return (
      <Backdrop
        open={true}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
      >
        {spinner}
      </Backdrop>
    );
  }

  // Centered on current container
  if (centered) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          width: '100%',
        }}
      >
        {spinner}
      </Box>
    );
  }

  // Inline spinner
  return spinner;
};

/**
 * Loading component alias for Spinner
 */
export const Loading = Spinner;

export default Spinner;
