import React from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';

export interface BadgeProps extends Omit<ChipProps, 'color'> {
  /**
   * Badge label/text
   */
  label: string;
  
  /**
   * Badge color variant
   * @default 'default'
   */
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  
  /**
   * Badge variant style
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined';
  
  /**
   * Badge size
   * @default 'medium'
   */
  size?: 'small' | 'medium';
  
  /**
   * Icon element
   */
  icon?: React.ReactElement;
  
  /**
   * Delete icon callback
   */
  onDelete?: () => void;
  
  /**
   * Click callback
   */
  onClick?: () => void;
  
  /**
   * Whether badge is clickable
   */
  clickable?: boolean;
}

/**
 * Badge/Chip component for labels and status indicators
 * 
 * @example
 * ```tsx
 * // Status badges
 * <Badge label="Active" color="success" />
 * <Badge label="Pending" color="warning" />
 * <Badge label="Inactive" color="error" />
 * 
 * // Outlined variant
 * <Badge label="Draft" variant="outlined" />
 * 
 * // With delete
 * <Badge
 *   label="Tag"
 *   onDelete={() => removeTag()}
 * />
 * 
 * // Clickable
 * <Badge
 *   label="Filter"
 *   clickable
 *   onClick={() => applyFilter()}
 * />
 * 
 * // Small size
 * <Badge label="New" size="small" color="primary" />
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  label,
  color = 'default',
  variant = 'filled',
  size = 'medium',
  icon,
  onDelete,
  onClick,
  clickable = false,
  ...props
}) => {
  return (
    <Chip
      label={label}
      color={color}
      variant={variant}
      size={size}
      icon={icon}
      onDelete={onDelete}
      onClick={onClick}
      clickable={clickable || !!onClick}
      {...props}
    />
  );
};

export default Badge;
