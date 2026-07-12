import React from 'react';
import { Tooltip as MuiTooltip } from '@mui/material';
import type { TooltipProps as MuiTooltipProps } from '@mui/material';

export interface TooltipProps extends Omit<MuiTooltipProps, 'title'> {
  /**
   * Tooltip content/text
   */
  title: React.ReactNode;
  
  /**
   * Element to trigger tooltip
   */
  children: React.ReactElement;
  
  /**
   * Tooltip placement
   * @default 'top'
   */
  placement?:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'left-start'
    | 'left-end'
    | 'right-start'
    | 'right-end';
  
  /**
   * Delay in ms before showing tooltip
   * @default 0
   */
  enterDelay?: number;
  
  /**
   * Delay in ms before hiding tooltip
   * @default 0
   */
  leaveDelay?: number;
  
  /**
   * Whether tooltip follows cursor
   * @default false
   */
  followCursor?: boolean;
  
  /**
   * Arrow indicator
   * @default false
   */
  arrow?: boolean;
}

/**
 * Tooltip component for displaying helpful hints
 * 
 * @example
 * ```tsx
 * // Basic tooltip
 * <Tooltip title="Click to edit">
 *   <Button>Edit</Button>
 * </Tooltip>
 * 
 * // With arrow
 * <Tooltip title="Delete this item" arrow>
 *   <IconButton>
 *     <DeleteIcon />
 *   </IconButton>
 * </Tooltip>
 * 
 * // Different placement
 * <Tooltip title="Help text" placement="right">
 *   <HelpIcon />
 * </Tooltip>
 * 
 * // With delay
 * <Tooltip title="Appears after 500ms" enterDelay={500}>
 *   <span>Hover me</span>
 * </Tooltip>
 * 
 * // Rich content
 * <Tooltip
 *   title={
 *     <div>
 *       <strong>User Details</strong>
 *       <p>Name: John Doe</p>
 *       <p>Email: john@example.com</p>
 *     </div>
 *   }
 * >
 *   <Avatar>JD</Avatar>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  title,
  children,
  placement = 'top',
  enterDelay = 0,
  leaveDelay = 0,
  followCursor = false,
  arrow = false,
  ...props
}) => {
  return (
    <MuiTooltip
      title={title}
      placement={placement}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      followCursor={followCursor}
      arrow={arrow}
      {...props}
    >
      {children}
    </MuiTooltip>
  );
};

export default Tooltip;
