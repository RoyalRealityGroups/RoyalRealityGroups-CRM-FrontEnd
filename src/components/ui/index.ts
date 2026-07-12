/**
 * UI Components Index
 *
 * Central export for all reusable UI components
 */

// Loading States
export {
  SkeletonBox,
  TableSkeleton,
  CardSkeleton,
  CardGridSkeleton,
  StatsCardSkeleton,
  ListItemSkeleton,
  FormSkeleton,
  PageSkeleton,
  DetailPageSkeleton,
} from './LoadingSkeleton'

// Buttons
export { default as Button, IconButton, ButtonGroup } from './Button'

// Badges
export {
  default as Badge,
  StatusBadge,
  PriorityBadge,
  CountBadge,
} from './Badge'

// Empty States
export {
  default as EmptyState,
  NoSearchResults,
  NoItems,
  ComingSoon,
  ErrorState,
  LoadingState,
} from './EmptyState'

// Navigation
export { default as Breadcrumb, generateBreadcrumbs } from './Breadcrumb'

// Existing Components
export { default as StatsCard } from './StatsCard'
export { default as ToastProvider } from './ToastProvider'

// Confirm Dialog
export { default as ConfirmDialogProvider, useConfirm } from './ConfirmDialog'
export type { ConfirmOptions } from './ConfirmDialog'
