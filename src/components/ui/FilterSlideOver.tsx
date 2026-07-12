/**
 * Filter Slide-Over Component
 *
 * Reusable slide-over panel for filters in Requirements, Tasks, etc.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { X, Filter, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'

interface FilterSlideOverProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  onClearAll?: () => void
  hasActiveFilters?: boolean
  children: ReactNode
}

const FilterSlideOver = ({
  isOpen,
  onClose,
  title = 'Filters',
  onClearAll,
  hasActiveFilters = false,
  children,
}: FilterSlideOverProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[60]"
          />

          {/* Slide Over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed -top-px bottom-0 right-0 w-full max-w-sm bg-gray-50 shadow-xl z-[70] flex flex-col pt-px"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                  {hasActiveFilters && (
                    <p className="text-xs text-blue-600">Filters applied</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {hasActiveFilters && onClearAll && (
                  <button
                    onClick={onClearAll}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 bg-white">
              {children}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200">
              {hasActiveFilters && onClearAll && (
                <button
                  onClick={onClearAll}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Filter Section Component
interface FilterSectionProps {
  title: string
  children: ReactNode
}

export const FilterSection = ({ title, children }: FilterSectionProps) => (
  <div className="mb-5">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
    {children}
  </div>
)

// Filter Pills Component
interface FilterPillsProps {
  options: Array<{
    value: string
    label: string
    count?: number
    color?: string
    bgColor?: string
  }>
  selected: string
  onChange: (value: string) => void
}

export const FilterPills = ({ options, selected, onChange }: FilterPillsProps) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => (
      <button
        key={option.value}
        onClick={() => onChange(selected === option.value ? '' : option.value)}
        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
          selected === option.value
            ? `${option.bgColor || 'bg-blue-100'} ${option.color || 'text-blue-700'} ring-2 ring-offset-1 ring-current`
            : `${option.bgColor || 'bg-gray-100'} ${option.color || 'text-gray-700'} hover:ring-1 ring-gray-300`
        }`}
      >
        {option.label}
        {option.count !== undefined && (
          <span className="ml-1.5 px-1.5 py-0.5 bg-white/60 rounded text-xs">{option.count}</span>
        )}
      </button>
    ))}
  </div>
)

// Filter Select Component
interface FilterSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const FilterSelect = ({ label, value, onChange, options, placeholder = 'Select...' }: FilterSelectProps) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
)

// Filter Search Component
interface FilterSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const FilterSearch = ({ value, onChange, placeholder = 'Search...' }: FilterSearchProps) => (
  <div className="relative">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
)

export default FilterSlideOver
