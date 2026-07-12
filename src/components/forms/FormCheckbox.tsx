import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import {
  FormControlLabel,
  Checkbox,
  FormHelperText,
  FormControl,
} from '@mui/material';
import type { CheckboxProps } from '@mui/material';

export interface FormCheckboxProps extends Omit<CheckboxProps, 'name'> {
  /**
   * Field name (must match schema field)
   */
  name: string;
  
  /**
   * Checkbox label
   */
  label: string;
  
  /**
   * Helper text (shown when no error)
   */
  helperText?: string;
  
  /**
   * Whether checkbox is disabled
   */
  disabled?: boolean;
}

/**
 * Form-aware checkbox component that integrates with React Hook Form
 * 
 * Must be used inside a <Form> component
 * 
 * @example
 * ```tsx
 * <Form schema={schema} onSubmit={handleSubmit}>
 *   <FormCheckbox
 *     name="agreeToTerms"
 *     label="I agree to the terms and conditions"
 *     required
 *   />
 *   <FormCheckbox
 *     name="subscribe"
 *     label="Subscribe to newsletter"
 *     helperText="Receive updates about new features"
 *   />
 * </Form>
 * ```
 */
export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  name,
  label,
  helperText,
  disabled = false,
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
        <FormControl error={!!fieldError} component="fieldset">
          <FormControlLabel
            control={
              <Checkbox
                {...field}
                {...props}
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                disabled={disabled}
                inputProps={{
                  'aria-invalid': !!fieldError,
                  'aria-describedby': errorMessage ? `${name}-error` : undefined,
                }}
              />
            }
            label={label}
          />
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

export default FormCheckbox;
