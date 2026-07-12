/**
 * OquisSpinner — Branded loading spinner using the animated Oquis icon
 * Replaces generic circle spinners for page/section-level loading states
 */

interface OquisSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}

const OquisSpinner = ({ size = 'md', message }: OquisSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <img
        src="/assets/oquis-icon-iris-reveal-glow.svg"
        alt="Loading..."
        className={sizeMap[size]}
      />
      {message && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  )
}

export default OquisSpinner
