import React from 'react';
import { AlertTitle, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { AlertProps as MuiAlertProps } from '@mui/material';
import AutoDismissAlert from './AutoDismissAlert';

export interface AlertProps extends Omit<MuiAlertProps, 'title'> {
  /**
   * Alert title
   */
  title?: string;
  
  /**
   * Alert message/content
   */
  children: React.ReactNode;
  
  /**
   * Alert severity/variant
   * @default 'info'
   */
  severity?: 'success' | 'info' | 'warning' | 'error';
  
  /**
   * Alert variant style
   * @default 'standard'
   */
  variant?: 'standard' | 'filled' | 'outlined';
  
  /**
   * Whether alert can be closed
   * @default false
   */
  closable?: boolean;
  
  /**
   * Callback when close button is clicked
   */
  onClose?: () => void;
  
  /**
   * Custom icon
   */
  icon?: React.ReactNode;
  
  /**
   * Hide icon
   */
  hideIcon?: boolean;
}

/**
 * Alert/Banner component for displaying feedback messages
 * 
 * @example
 * ```tsx
 * // Success alert
 * <Alert severity="success">
 *   Order created successfully!
 * </Alert>
 * 
 * // Error alert with title
 * <Alert severity="error" title="Validation Error">
 *   Please fix the following errors before submitting.
 * </Alert>
 * 
 * // Closable warning
 * <Alert
 *   severity="warning"
 *   closable
 *   onClose={() => setShowAlert(false)}
 * >
 *   Your session will expire in 5 minutes.
 * </Alert>
 * 
 * // Filled variant
 * <Alert severity="info" variant="filled">
 *   New features available!
 * </Alert>
 * ```
 */
export const Alert: React.FC<AlertProps> = ({
  title,
  children,
  severity = 'info',
  variant = 'standard',
  closable = false,
  onClose,
  icon,
  hideIcon = false,
  ...props
}) => {
  return (
    <AutoDismissAlert
      severity={severity}
      variant={variant}
      icon={hideIcon ? false : icon}
      action={
        closable && onClose ? (
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        ) : undefined
      }
      sx={{
        width: '100%',
        ...props.sx,
      }}
      {...props}
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      <Box>{children}</Box>
    </AutoDismissAlert>
  );
};

/**
 * Banner component (alias for Alert with different default styling)
 */
export const Banner = Alert;

export default Alert;
