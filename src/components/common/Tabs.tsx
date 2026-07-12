import React, { useState } from 'react';
import { Tabs as MuiTabs, Tab, Box } from '@mui/material';
import type { TabsProps as MuiTabsProps } from '@mui/material';

export interface TabItem {
  /**
   * Tab label
   */
  label: string;
  
  /**
   * Tab content
   */
  content: React.ReactNode;
  
  /**
   * Tab icon
   */
  icon?: React.ReactElement;
  
  /**
   * Whether tab is disabled
   */
  disabled?: boolean;
  
  /**
   * Tab value (auto-generated if not provided)
   */
  value?: string | number;
}

export interface TabsProps extends Omit<MuiTabsProps, 'value' | 'onChange'> {
  /**
   * Array of tab items
   */
  items: TabItem[];
  
  /**
   * Default active tab index
   * @default 0
   */
  defaultTab?: number;
  
  /**
   * Controlled tab value
   */
  value?: number;
  
  /**
   * Callback when tab changes
   */
  onChange?: (index: number) => void;
  
  /**
   * Tabs orientation
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Tabs variant
   * @default 'standard'
   */
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  
  /**
   * Whether to show content with animation
   * @default true
   */
  animated?: boolean;
}

/**
 * Tabs component for organizing content into separate views
 * 
 * @example
 * ```tsx
 * const tabs = [
 *   {
 *     label: 'Details',
 *     content: <OrderDetails />,
 *   },
 *   {
 *     label: 'Items',
 *     content: <OrderItems />,
 *   },
 *   {
 *     label: 'History',
 *     content: <OrderHistory />,
 *     icon: <HistoryIcon />,
 *   },
 * ];
 * 
 * <Tabs items={tabs} />
 * 
 * // Controlled tabs
 * <Tabs
 *   items={tabs}
 *   value={activeTab}
 *   onChange={setActiveTab}
 * />
 * 
 * // Vertical tabs
 * <Tabs items={tabs} orientation="vertical" />
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab = 0,
  value: controlledValue,
  onChange: controlledOnChange,
  orientation = 'horizontal',
  variant = 'standard',
  animated = true,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(defaultTab);
  
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    if (controlledOnChange) {
      controlledOnChange(newValue);
    }
  };

  const currentContent = items[currentValue]?.content;

  return (
    <Box
      sx={{
        display: orientation === 'vertical' ? 'flex' : 'block',
        width: '100%',
      }}
    >
      <MuiTabs
        value={currentValue}
        onChange={handleChange}
        orientation={orientation}
        variant={variant}
        {...props}
        sx={{
          borderBottom: orientation === 'horizontal' ? 1 : 0,
          borderRight: orientation === 'vertical' ? 1 : 0,
          borderColor: 'divider',
          minWidth: orientation === 'vertical' ? '200px' : undefined,
          ...props.sx,
        }}
      >
        {items.map((item, index) => (
          <Tab
            key={item.value ?? index}
            label={item.label}
            icon={item.icon}
            disabled={item.disabled}
            value={index}
            iconPosition="start"
          />
        ))}
      </MuiTabs>

      <Box
        sx={{
          flex: 1,
          p: 3,
          ...(animated && {
            animation: 'fadeIn 0.3s ease-in',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }),
        }}
      >
        {currentContent}
      </Box>
    </Box>
  );
};

export default Tabs;
