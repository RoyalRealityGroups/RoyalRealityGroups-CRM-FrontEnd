import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import SearchableDropdown from '../common/SearchableDropdown';
import type { DropdownOption } from '../../types/common.types';

export interface FormSearchableDropdownProps {
  /**
   * Field name (must match schema field)
   */
  name: string;
  
  /**
   * Field label
   */
  label: string;
  
  /**
   * API endpoint to fetch options from
   */
  apiEndpoint: string;
  
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
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Transform function to convert form value (id) to DropdownOption
   * This is needed when loading existing data
   */
  valueTransform?: (id: string | number | null) => DropdownOption | null;
  
  /**
   * Custom onChange handler (called after form state update)
   */
  onChangeCallback?: (value: DropdownOption | DropdownOption[] | null) => void;
}

/**
 * Form-aware searchable dropdown component that integrates with React Hook Form
 * 
 * Must be used inside a <Form> component
 * This component wraps the existing SearchableDropdown with form integration
 * 
 * Note: The form value will be the complete DropdownOption object { id, name }
 * If you only want to store the ID, use a transform in your onSubmit handler
 * 
 * @example
 * ```tsx
 * // Schema that accepts the full option object
 * const schema = z.object({
 *   state: z.object({
 *     id: z.union([z.string(), z.number()]),
 *     name: z.string(),
 *   }).nullable().refine(val => val !== null, 'State is required'),
 * });
 * 
 * // Or schema that accepts just the ID (with transform)
 * const schema = z.object({
 *   state_id: z.union([z.string(), z.number()]).min(1, 'State is required'),
 * });
 * 
 * <Form schema={schema} onSubmit={handleSubmit}>
 *   <FormSearchableDropdown
 *     name="state"
 *     label="State"
 *     apiEndpoint="/api/masters/states/"
 *     required
 *     placeholder="Select a state"
 *   />
 * </Form>
 * ```
 */
export const FormSearchableDropdown: React.FC<FormSearchableDropdownProps> = ({
  name,
  label,
  apiEndpoint,
  required = false,
  disabled = false,
  helperText,
  placeholder,
  valueTransform,
  onChangeCallback,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const fieldError = errors[name];
  const errorMessage = fieldError?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        // Convert field value to DropdownOption if needed
        const dropdownValue = (() => {
          if (field.value === null || field.value === undefined || field.value === '') {
            return null;
          }
          
          // If value is already a DropdownOption object
          if (typeof field.value === 'object' && 'id' in field.value && 'name' in field.value) {
            return field.value as DropdownOption;
          }
          
          // If value is just an ID and we have a transform function
          if (valueTransform) {
            return valueTransform(field.value);
          }
          
          // Default: assume it's an ID and create a minimal DropdownOption
          // This won't display correctly but prevents crashes
          return { id: field.value, name: '' } as DropdownOption;
        })();

        return (
          <SearchableDropdown
            label={label}
            apiEndpoint={apiEndpoint}
            value={dropdownValue}
            onChange={(newValue) => {
              field.onChange(newValue);
              if (onChangeCallback) {
                onChangeCallback(newValue);
              }
            }}
            error={!!fieldError}
            helperText={errorMessage || helperText}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
          />
        );
      }}
    />
  );
};

export default FormSearchableDropdown;
