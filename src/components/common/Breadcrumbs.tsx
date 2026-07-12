import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import type { BreadcrumbsProps as MuiBreadcrumbsProps } from '@mui/material';

export interface BreadcrumbItem {
  /**
   * Breadcrumb label
   */
  label: string;
  
  /**
   * Link path (if clickable)
   */
  href?: string;
  
  /**
   * Click handler (if clickable)
   */
  onClick?: () => void;
  
  /**
   * Icon element
   */
  icon?: React.ReactElement;
}

export interface BreadcrumbsProps extends Omit<MuiBreadcrumbsProps, 'children'> {
  /**
   * Array of breadcrumb items
   */
  items: BreadcrumbItem[];
  
  /**
   * Whether to show home icon on first item
   * @default true
   */
  showHomeIcon?: boolean;
  
  /**
   * Custom separator
   * @default <NavigateNextIcon />
   */
  separator?: React.ReactNode;
  
  /**
   * Maximum number of items to display
   * @default undefined (show all)
   */
  maxItems?: number;
}

/**
 * Breadcrumbs component for navigation hierarchy
 * 
 * @example
 * ```tsx
 * const breadcrumbs = [
 *   { label: 'Home', href: '/' },
 *   { label: 'Orders', href: '/orders' },
 *   { label: 'Order #12345' },
 * ];
 * 
 * <Breadcrumbs items={breadcrumbs} />
 * 
 * // With onClick handlers
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', onClick: () => navigate('/') },
 *     { label: 'Products', onClick: () => navigate('/products') },
 *     { label: 'Product Details' },
 *   ]}
 * />
 * 
 * // With icons
 * <Breadcrumbs
 *   items={[
 *     { label: 'Dashboard', icon: <DashboardIcon />, href: '/' },
 *     { label: 'Settings', icon: <SettingsIcon /> },
 *   ]}
 * />
 * 
 * // Collapsed (max items)
 * <Breadcrumbs items={longBreadcrumbs} maxItems={3} />
 * ```
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  showHomeIcon = true,
  separator = <NavigateNextIcon fontSize="small" />,
  maxItems,
  ...props
}) => {
  const renderBreadcrumb = (item: BreadcrumbItem, index: number) => {
    const isLast = index === items.length - 1;
    const icon = index === 0 && showHomeIcon && !item.icon 
      ? <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
      : item.icon;

    const content = (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {icon}
        {item.label}
      </Box>
    );

    // Last item (current page) - not clickable
    if (isLast) {
      return (
        <Typography
          key={index}
          color="text.primary"
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {content}
        </Typography>
      );
    }

    // Clickable breadcrumb
    if (item.href || item.onClick) {
      return (
        <Link
          key={index}
          underline="hover"
          color="inherit"
          href={item.href}
          onClick={(e) => {
            if (item.onClick) {
              e.preventDefault();
              item.onClick();
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          {content}
        </Link>
      );
    }

    // Non-clickable breadcrumb
    return (
      <Typography
        key={index}
        color="text.secondary"
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {content}
      </Typography>
    );
  };

  return (
    <MuiBreadcrumbs
      separator={separator}
      maxItems={maxItems}
      {...props}
      sx={{
        mb: 2,
        ...props.sx,
      }}
    >
      {items.map((item, index) => renderBreadcrumb(item, index))}
    </MuiBreadcrumbs>
  );
};

// Import Box for icon layout
import { Box } from '@mui/material';

export default Breadcrumbs;
