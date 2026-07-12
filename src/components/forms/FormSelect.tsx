import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  ListSubheader,
} from '@mui/material';
import type { SelectProps as MuiSelectProps } from '@mui/material';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface FormSelectProps extends Omit<MuiSelectProps, 'name' | 'error'> {
  /**
   * Field name (must match schema field)
   */
  name: string;
  
  /**
   * Field label
   */
  label?: string;
  
  /**
   * Select options
   */
  options: SelectOption[];
  
  /**
   * Placeholder text (shown when no value selected)
   */
  placeholder?: string;
  
  /**
   * Whether field is required (visual indicator only, validation is in schema)
   */
  required?: boolean;
  
  /**
   * Whether field is disabled
   */
  disabled?: boolean;
  
  /**
   * Helper text (shown when no error)
   */
  helperText?: string;
  
  /**
   * Whether to allow multiple selections
   */
  multiple?: boolean;
  
  /**
   * Whether to show native select on mobile
   */
  native?: boolean;
}

/**
 * Form-aware select component that integrates with React Hook Form
 * 
 * Must be used inside a <Form> component
 * Use this for simple, static dropdowns (like status, yes/no, etc.)
 * For API-based dropdowns, use SearchableDropdown component instead
 * 
 * @example
 * ```tsx
 * const statusOptions = [
 *   { value: 'active', label: 'Active' },
 *   { value: 'inactive', label: 'Inactive' },
 * ];
 * 
 * <Form schema={schema} onSubmit={handleSubmit}>
 *   <FormSelect
 *     name="status"
 *     label="Status"
 *     options={statusOptions}
 *     required
 *     placeholder="Select status"
 *   />
 * </Form>
 * ```
 */
export const FormSelect: React.FC<FormSelectProps> = ({
  name,
  label,
  options,
  placeholder,
  required = false,
  disabled = false,
  helperText,
  multiple = false,
  native = false,
  ...props
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const fieldError = errors[name];
  const errorMessage = fieldError?.message as string | undefined;

  // Group options by group property if present
  const hasGroups = options.some(opt => opt.group);
  const groupedOptions = hasGroups
    ? options.reduce((acc, option) => {
        const group = option.group || 'Other';
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(option);
        return acc;
      }, {} as Record<string, SelectOption[]>)
    : null;

  const renderOptions = () => {
    if (native) {
      // Native select options
      return (
        <>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </>
      );
    }

    // Material-UI select options
    const menuItems: React.ReactNode[] = [];

    if (placeholder && !multiple) {
      menuItems.push(
        <MenuItem key="placeholder" value="" disabled>
          <em>{placeholder}</em>
        </MenuItem>
      );
    }

    if (groupedOptions) {
      // Render grouped options
      Object.entries(groupedOptions).forEach(([group, groupOptions]) => {
        menuItems.push(
          <ListSubheader key={`group-${group}`}>{group}</ListSubheader>
        );
        groupOptions.forEach((option) => {
          menuItems.push(
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </MenuItem>
          );
        });
      });
    } else {
      // Render flat options
      options.forEach((option) => {
        menuItems.push(
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        );
      });
    }

    return menuItems;
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const { variant: _unusedVariant, ...selectProps } = props || {};
        return (
        <FormControl
          fullWidth
          size="small"
          error={!!fieldError}
          disabled={disabled}
          required={required}
        >
          {label && (
            <InputLabel id={`${name}-label`}>
              {label}
            </InputLabel>
          )}
          <Select
            {...field}
            {...selectProps}
            labelId={label ? `${name}-label` : undefined}
            id={name}
            label={label}
            multiple={multiple}
            native={native}
            displayEmpty={!!placeholder}
            value={field.value ?? (multiple ? [] : '')}
            onChange={(e) => {
              field.onChange(e.target.value);
            }}
            inputProps={{
              'aria-invalid': !!fieldError,
              'aria-describedby': errorMessage ? `${name}-error` : undefined,
            }}
          >
            {renderOptions()}
          </Select>
          {(errorMessage || helperText) && (
            <FormHelperText id={errorMessage ? `${name}-error` : undefined}>
              {errorMessage || helperText}
            </FormHelperText>
          )}
        </FormControl>
      )}}
    />
  );
};

export default FormSelect;
