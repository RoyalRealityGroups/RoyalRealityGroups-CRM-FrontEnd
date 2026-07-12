import React, { useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { TextField, InputAdornment } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

export interface FormInputProps extends Omit<TextFieldProps, 'name' | 'error' | 'helperText'> {
  /**
   * Field name (must match schema field)
   */
  name: string;
  
  /**
   * Field label
   */
  label?: string;
  
  /**
   * Input type
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  
  /**
   * Placeholder text
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
   * Icon to display at start of input
   */
  startIcon?: React.ReactNode;
  
  /**
   * Icon to display at end of input
   */
  endIcon?: React.ReactNode;
  
  /**
   * Maximum length of input
   */
  maxLength?: number;
  
  /**
   * Minimum value (for number inputs)
   */
  min?: number;
  
  /**
   * Maximum value (for number inputs)
   */
  max?: number;
  
  /**
   * Step value (for number inputs)
   */
  step?: number;
  
  /**
   * Number of rows (for multiline)
   */
  rows?: number;
  
  /**
   * Whether input is multiline
   */
  multiline?: boolean;
  
  /**
   * Auto focus on mount
   */
  autoFocus?: boolean;
  
  /**
   * Autocomplete attribute
   */
  autoComplete?: string;
}

/**
 * Form-aware input component that integrates with React Hook Form
 * 
 * Must be used inside a <Form> component
 * 
 * @example
 * ```tsx
 * <Form schema={schema} onSubmit={handleSubmit}>
 *   <FormInput
 *     name="email"
 *     label="Email Address"
 *     type="email"
 *     required
 *     placeholder="Enter your email"
 *   />
 *   <FormInput
 *     name="password"
 *     label="Password"
 *     type="password"
 *     required
 *     helperText="Must be at least 8 characters"
 *   />
 * </Form>
 * ```
 */
export const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  helperText,
  startIcon,
  endIcon,
  maxLength,
  min,
  max,
  step,
  rows,
  multiline = false,
  autoFocus = false,
  autoComplete,
  ...props
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const fieldError = errors[name];
  const errorMessage = fieldError?.message as string | undefined;

  const inputProps = useMemo(() => ({
    startAdornment: startIcon ? (
      <InputAdornment position="start">{startIcon}</InputAdornment>
    ) : undefined,
    endAdornment: endIcon ? (
      <InputAdornment position="end">{endIcon}</InputAdornment>
    ) : undefined,
    inputProps: {
      maxLength,
      min,
      max,
      step,
      'aria-invalid': !!fieldError,
      'aria-describedby': errorMessage ? `${name}-error` : undefined,
    },
  }), [startIcon, endIcon, maxLength, min, max, step, fieldError, errorMessage, name]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          {...props}
          label={label}
          type={type}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          error={!!fieldError}
          helperText={errorMessage || helperText}
          fullWidth
          variant="outlined"
          size="small"
          multiline={multiline}
          rows={multiline ? rows : undefined}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          InputProps={inputProps}
          sx={{
            '& .MuiInputLabel-asterisk': {
              color: 'error.main',
            },
          }}
        />
      )}
    />
  );
};

export default FormInput;
