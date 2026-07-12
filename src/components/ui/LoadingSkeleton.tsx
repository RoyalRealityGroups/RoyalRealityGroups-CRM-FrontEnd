/**
 * Loading Skeleton Components
 *
 * Professional skeleton loaders for different content types
 */
import { motion } from 'framer-motion'

// Base skeleton with shimmer animation
const shimmer = {
  hidden: { backgroundPosition: '-200% 0' },
  visible: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  },
}

export const SkeletonBox = ({ className = '' }: { className?: string }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={shimmer}
    className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${className}`}
    style={{ backgroundSize: '200% 100%' }}
  />
)

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) => (
  <div className="bg-white border border-gray-200">
    <table className="min-w-full">
      <thead className="bg-gray-50">
        <tr>
          {[...Array(columns)].map((_, i) => (
            <th key={i} className="px-6 py-3">
              <SkeletonBox className="h-4" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {[...Array(rows)].map((_, rowIndex) => (
          <tr key={rowIndex}>
            {[...Array(columns)].map((_, colIndex) => (
              <td key={colIndex} className="px-6 py-4">
                <SkeletonBox className="h-4" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// Card skeleton
export const CardSkeleton = () => (
  <div className="bg-white border border-gray-200 p-6 space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-5 w-3/4" />
        <SkeletonBox className="h-4 w-1/2" />
      </div>
      <SkeletonBox className="h-6 w-20" />
    </div>
    <SkeletonBox className="h-2 w-full" />
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-4 w-24" />
      <SkeletonBox className="h-4 w-24" />
    </div>
  </div>
)

// Grid of cards skeleton
export const CardGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(count)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
)

// Stats card skeleton
export const StatsCardSkeleton = () => (
  <div className="bg-white border border-gray-200 p-6">
    <div className="flex items-start justify-between mb-4">
      <SkeletonBox className="w-12 h-12" />
      <SkeletonBox className="h-5 w-16" />
    </div>
    <SkeletonBox className="h-4 w-24 mb-2" />
    <SkeletonBox className="h-8 w-16 mb-2" />
    <SkeletonBox className="h-3 w-32" />
  </div>
)

// List item skeleton
export const ListItemSkeleton = () => (
  <div className="p-6 border-b border-gray-200">
    <div className="flex items-start space-x-4">
      <SkeletonBox className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-3 w-1/2" />
        <SkeletonBox className="h-3 w-2/3" />
      </div>
    </div>
  </div>
)

// Form skeleton
export const FormSkeleton = ({ fields = 6 }: { fields?: number }) => (
  <div className="bg-white border border-gray-200 p-6 space-y-6">
    {[...Array(fields)].map((_, i) => (
      <div key={i} className="space-y-2">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-10 w-full" />
      </div>
    ))}
    <div className="flex justify-end space-x-3 pt-4">
      <SkeletonBox className="h-10 w-24" />
      <SkeletonBox className="h-10 w-24" />
    </div>
  </div>
)

// Page skeleton (for full page loading)
export const PageSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBox className="h-9 w-64" />
        <SkeletonBox className="h-5 w-96" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonBox key={i} className="h-16" />
          ))}
        </div>
      </div>
    </div>
  </div>
)

// Detail page skeleton
export const DetailPageSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SkeletonBox className="h-9 w-9" />
          <div className="space-y-2">
            <SkeletonBox className="h-8 w-96" />
            <SkeletonBox className="h-5 w-64" />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <SkeletonBox className="h-10 w-24" />
          <SkeletonBox className="h-10 w-24" />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex space-x-8 px-6">
          {[...Array(5)].map((_, i) => (
            <SkeletonBox key={i} className="h-12 w-24" />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 p-6 space-y-4">
            <SkeletonBox className="h-6 w-48" />
            <SkeletonBox className="h-20" />
            <SkeletonBox className="h-40" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6 space-y-4">
            <SkeletonBox className="h-5 w-32" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)
