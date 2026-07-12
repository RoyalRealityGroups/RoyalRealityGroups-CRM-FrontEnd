/**
 * Button Component
 *
 * Professional, consistent button component with variants and sizes
 */
import { motion, type HTMLMotionProps } from 'framer-motion'
import type { SvgIconComponent } from '@mui/icons-material'
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<'button'>> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: SvgIconComponent
  iconRight?: SvgIconComponent
  loading?: boolean
  fullWidth?: boolean
  className?: string
  children?: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark focus:ring-primary border-transparent shadow-sm',
  secondary:
    'bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary border-transparent shadow-sm',
  outline:
    'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-primary',
  ghost: 'bg-transparent text-gray-700 border-transparent hover:bg-gray-100 focus:ring-gray-300',
  danger:
    'bg-error text-white hover:bg-red-700 focus:ring-error border-transparent shadow-sm',
  success:
    'bg-success text-white hover:bg-green-700 focus:ring-success border-transparent shadow-sm',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

const iconSizes: Record<ButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconRight: IconRight,
      loading = false,
      fullWidth = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center space-x-2 font-medium
          border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${buttonVariants[variant]}
          ${buttonSizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg
            className={`animate-spin ${iconSizes[size]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && Icon && <Icon className={iconSizes[size]} />}
        {children && <span>{children}</span>}
        {!loading && IconRight && <IconRight className={iconSizes[size]} />}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button

/**
 * Icon-only button variant
 */
export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'icon'> & { icon: SvgIconComponent }
>(({ icon: Icon, size = 'md', variant = 'ghost', className = '', ...props }, ref) => {
  const iconOnlySize = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  }

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        inline-flex items-center justify-center font-medium
        border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${buttonVariants[variant]}
        ${iconOnlySize[size]}
        ${className}
      `}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </motion.button>
  )
})

IconButton.displayName = 'IconButton'

/**
 * Button group for related actions
 */
export const ButtonGroup = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div className={`inline-flex border border-gray-300 divide-x divide-gray-300 ${className}`}>
    {children}
  </div>
)
