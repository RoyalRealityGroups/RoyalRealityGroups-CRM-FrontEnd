/**
 * Empty State Component
 *
 * Professional empty states with icons, actions, and descriptions
 */
import type { SvgIconComponent } from '@mui/icons-material'
import Button from './Button'

interface EmptyStateProps {
  icon?: SvgIconComponent
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: SvgIconComponent
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) => {
  return (
    <div className={`text-center py-12 px-6 ${className}`}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center">
            <Icon sx={{ fontSize: 32, color: 'rgba(156, 163, 175, 1)' }} />
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>

      {(action || secondaryAction) && (
        <div className="flex items-center justify-center space-x-3">
          {action && (
            <Button
              variant="primary"
              onClick={action.onClick}
              icon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default EmptyState

/**
 * Specialized empty states for common scenarios
 */

// No search results
export const NoSearchResults = ({
  query,
  onClearSearch,
}: {
  query: string
  onClearSearch: () => void
}) => {
  return (
    <EmptyState
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search or filters.`}
      action={{
        label: 'Clear Search',
        onClick: onClearSearch,
      }}
    />
  )
}

// No items (generic)
export const NoItems = ({
  icon: Icon,
  itemName,
  onCreate,
  className = '',
}: {
  icon: SvgIconComponent
  itemName: string
  onCreate: () => void
  className?: string
}) => {
  return (
    <EmptyState
      icon={Icon}
      title={`No ${itemName} yet`}
      description={`Get started by creating your first ${itemName}.`}
      action={{
        label: `Create ${itemName}`,
        onClick: onCreate,
      }}
      className={className}
    />
  )
}

// Coming soon
export const ComingSoon = ({ feature }: { feature: string }) => {
  return (
    <EmptyState
      title="Coming Soon"
      description={`${feature} is currently under development and will be available soon.`}
      className="py-20"
    />
  )
}

// Error state
export const ErrorState = ({
  title = 'Something went wrong',
  description = 'An error occurred while loading this content. Please try again.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) => {
  return (
    <div className="text-center py-12 px-6">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-red-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>

      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}

// Loading state placeholder (different from skeleton)
export const LoadingState = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <div className="text-center py-12 px-6">
      <div className="flex justify-center mb-4">
        <img
          src="/assets/oquis-icon-iris-reveal-glow.svg"
          alt="Loading..."
          className="h-12 w-12"
        />
      </div>
      <p className="text-gray-600">{message}</p>
    </div>
  )
}
