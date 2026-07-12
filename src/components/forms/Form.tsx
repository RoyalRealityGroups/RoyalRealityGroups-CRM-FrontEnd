import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box } from '@mui/material';

export interface FormProps<T extends z.ZodType<any, any>> {
  /**
   * Zod schema for form validation
   */
  schema: T;
  
  /**
   * Default values for form fields
   */
  defaultValues?: Partial<z.infer<T>>;
  
  /**
   * Form submission handler
   */
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  
  /**
   * Form children (form fields)
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Form ID
   */
  id?: string;
  
  /**
   * Validation mode
   * @default 'onSubmit'
   */
  mode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  
  /**
   * Revalidate mode
   * @default 'onChange'
   */
  reValidateMode?: 'onSubmit' | 'onBlur' | 'onChange';
  
  /**
   * Reset form after successful submission
   * @default false
   */
  resetOnSubmit?: boolean;
}

/**
 * Reusable Form component with React Hook Form and Zod validation
 * 
 * @example
 * ```tsx
 * const schema = z.object({
 *   email: z.string().email('Invalid email'),
 *   password: z.string().min(6, 'Password must be at least 6 characters'),
 * });
 * 
 * <Form
 *   schema={schema}
 *   defaultValues={{ email: '' }}
 * >
 *   <FormInput name="email" label="Email" />
 *   <FormInput name="password" label="Password" type="password" />
 *   <Button type="submit">Submit</Button>
 * </Form>
 * ```
 */
export function Form<T extends z.ZodType<any, any>>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  id,
  mode = 'onSubmit',
  reValidateMode = 'onChange',
  resetOnSubmit = false,
}: FormProps<T>) {
  type FormData = z.infer<T>;
  
  const methods = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues as FormData,
    mode,
    reValidateMode,
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    try {
      await onSubmit(data as z.infer<T>);
      if (resetOnSubmit) {
        methods.reset();
      }
    } catch (error) {
      // Error handling can be done here or in the onSubmit callback
    }
  });

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        className={className}
        id={id}
        noValidate
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {children}
      </Box>
    </FormProvider>
  );
}

export default Form;
