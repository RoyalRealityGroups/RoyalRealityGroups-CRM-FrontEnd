import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';
import type { RadioGroupProps } from '@mui/material';

export interface RadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormRadioGroupProps extends Omit<RadioGroupProps, 'name'> {
  /**
   * Field name (must match schema field)
   */
  name: string;
  
  /**
   * Group label
   */
  label?: string;
  
  /**
   * Radio options
   */
  options: RadioOption[];
  
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
   * Layout direction
   * @default 'column'
   */
  row?: boolean;
}

/**
 * Form-aware radio group component that integrates with React Hook Form
 * 
 * Must be used inside a <Form> component
 * 
 * @example
 * ```tsx
 * const genderOptions = [
 *   { value: 'male', label: 'Male' },
 *   { value: 'female', label: 'Female' },
 *   { value: 'other', label: 'Other' },
 * ];
 * 
 * <Form schema={schema} onSubmit={handleSubmit}>
 *   <FormRadioGroup
 *     name="gender"
 *     label="Gender"
 *     options={genderOptions}
 *     required
 *   />
 *   
 *   <FormRadioGroup
 *     name="status"
 *     label="Status"
 *     options={statusOptions}
 *     row
 *   />
 * </Form>
 * ```
 */
export const FormRadioGroup: React.FC<FormRadioGroupProps> = ({
  name,
  label,
  options,
  required = false,
  disabled = false,
  helperText,
  row = false,
  ...props
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
      render={({ field }) => (
        <FormControl
          component="fieldset"
          error={!!fieldError}
          required={required}
          disabled={disabled}
          fullWidth
        >
          {label && (
            <FormLabel component="legend" sx={{ mb: 1 }}>
              {label}
            </FormLabel>
          )}
          <RadioGroup
            {...field}
            {...props}
            row={row}
            aria-labelledby={label ? `${name}-label` : undefined}
          >
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
                disabled={option.disabled || disabled}
              />
            ))}
          </RadioGroup>
          {(errorMessage || helperText) && (
            <FormHelperText id={errorMessage ? `${name}-error` : undefined}>
              {errorMessage || helperText}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

export default FormRadioGroup;
