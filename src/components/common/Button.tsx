import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import type { ButtonProps as MuiButtonProps } from '@mui/material';

interface CustomButtonProps extends MuiButtonProps {
  loading?: boolean;
}

const Button: React.FC<CustomButtonProps> = ({ 
  children, 
  loading = false, 
  disabled,
  sx,
  ...props 
}) => {
  return (
    <MuiButton
      {...props}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} /> : props.startIcon}
      sx={{
        minHeight: '44px',
        minWidth: '44px',
        px: { xs: 2, sm: 3 },
        fontSize: { xs: '0.875rem', sm: '0.9375rem' },
        ...sx,
      }}
    >
      {children}
    </MuiButton>
  );
};

export default Button;