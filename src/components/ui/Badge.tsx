/**
 * Badge Component
 *
 * Professional status badges with color variants and sizes
 */
import type { SvgIconComponent } from '@mui/icons-material'

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'purple'
  | 'pink'
  | 'indigo'
  | 'cyan'

type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: SvgIconComponent
  dot?: boolean
  outline?: boolean
  className?: string
  onClick?: () => void
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-primary-light text-primary-dark',
  secondary: 'bg-secondary-light text-secondary-dark',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  pink: 'bg-pink-100 text-pink-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  cyan: 'bg-cyan-100 text-cyan-800',
}

const badgeVariantsOutline: Record<BadgeVariant, string> = {
  default: 'bg-white text-gray-800 border-gray-300',
  primary: 'bg-white text-primary border-primary',
  secondary: 'bg-white text-secondary border-secondary',
  success: 'bg-white text-green-800 border-green-300',
  warning: 'bg-white text-amber-800 border-amber-300',
  error: 'bg-white text-red-800 border-red-300',
  info: 'bg-white text-blue-800 border-blue-300',
  purple: 'bg-white text-purple-800 border-purple-300',
  pink: 'bg-white text-pink-800 border-pink-300',
  indigo: 'bg-white text-indigo-800 border-indigo-300',
  cyan: 'bg-white text-cyan-800 border-cyan-300',
}

const badgeSizes: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

const iconSizes: Record<BadgeSize, string> = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
}

const dotSizes: Record<BadgeSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
}

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
  dot = false,
  outline = false,
  className = '',
  onClick,
}: BadgeProps) => {
  const isInteractive = !!onClick

  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center space-x-1.5 font-semibold
        ${outline ? `border ${badgeVariantsOutline[variant]}` : badgeVariants[variant]}
        ${badgeSizes[size]}
        ${isInteractive ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
      `}
    >
      {dot && (
        <span className={`rounded-full bg-current ${dotSizes[size]}`} aria-hidden="true" />
      )}
      {Icon && <Icon className={iconSizes[size]} />}
      <span>{children}</span>
    </span>
  )
}

export default Badge

/**
 * Status Badge - Preset for common status values
 */
interface StatusBadgeProps {
  status:
    | 'active'
    | 'inactive'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'draft'
    | 'completed'
    | 'cancelled'
    | 'on_hold'
    | 'in_progress'
    | 'planned'
    | 'under_review'
    | 'in_support'
  size?: BadgeSize
  outline?: boolean
  className?: string
}

const statusConfig: Record<string, { variant: BadgeVariant; label: string; dot?: boolean }> = {
  active: { variant: 'success', label: 'Active', dot: true },
  inactive: { variant: 'default', label: 'Inactive', dot: true },
  pending: { variant: 'warning', label: 'Pending', dot: true },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'error', label: 'Rejected' },
  draft: { variant: 'default', label: 'Draft' },
  completed: { variant: 'purple', label: 'Completed' },
  cancelled: { variant: 'error', label: 'Cancelled' },
  on_hold: { variant: 'warning', label: 'On Hold', dot: true },
  in_progress: { variant: 'info', label: 'In Progress', dot: true },
  planned: { variant: 'indigo', label: 'Planned' },
  under_review: { variant: 'info', label: 'Under Review' },
  in_support: { variant: 'cyan', label: 'In Support', dot: true },
}

export const StatusBadge = ({
  status,
  size = 'md',
  outline = false,
  className = '',
}: StatusBadgeProps) => {
  const config = statusConfig[status]
  return (
    <Badge
      variant={config.variant}
      size={size}
      outline={outline}
      dot={config.dot || false}
      className={className}
    >
      {config.label}
    </Badge>
  )
}

/**
 * Priority Badge - Preset for priority values
 */
interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical'
  size?: BadgeSize
  outline?: boolean
  className?: string
}

const priorityConfig: Record<string, { variant: BadgeVariant; label: string; dot?: boolean }> = {
  low: { variant: 'default', label: 'Low' },
  medium: { variant: 'info', label: 'Medium' },
  high: { variant: 'warning', label: 'High' },
  critical: { variant: 'error', label: 'Critical', dot: true },
}

export const PriorityBadge = ({
  priority,
  size = 'md',
  outline = false,
  className = '',
}: PriorityBadgeProps) => {
  const config = priorityConfig[priority]
  return (
    <Badge
      variant={config.variant}
      size={size}
      outline={outline}
      dot={config.dot || false}
      className={className}
    >
      {config.label}
    </Badge>
  )
}

/**
 * Count Badge - For displaying counts (e.g., notifications)
 */
interface CountBadgeProps {
  count: number
  max?: number
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

export const CountBadge = ({
  count,
  max = 99,
  variant = 'error',
  size = 'sm',
  className = '',
}: CountBadgeProps) => {
  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <Badge variant={variant} size={size} className={className}>
      {displayCount}
    </Badge>
  )
}
