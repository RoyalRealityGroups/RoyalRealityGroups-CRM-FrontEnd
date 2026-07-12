/**
 * AppLoader — Full-screen branded loading screen
 * Uses Oquis brand colors: #01232a (navy) and #28C793 (green)
 */
import { motion } from 'framer-motion'

interface AppLoaderProps {
  message?: string
}

const AppLoader = ({ message }: AppLoaderProps) => {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'hsl(160, 25%, 97%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Soft radial glow behind logo */}
      <div
        className="absolute w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(40,199,147,0.10) 0%, transparent 68%)',
        }}
      />

      {/* Outer slow-spinning ring */}
      <motion.div
        className="absolute w-52 h-52 rounded-full pointer-events-none"
        style={{
          border: '1px solid rgba(40, 199, 147, 0.18)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner slow-spinning ring (counter) */}
      <motion.div
        className="absolute w-36 h-36 rounded-full pointer-events-none"
        style={{
          border: '1px dashed rgba(40, 199, 147, 0.22)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* Animated logo icon — draws itself, opens eyes, breathes */}
      <motion.img
        src="/assets/oquis-icon-iris-reveal-glow.svg"
        alt="Oquis PMS"
        className="relative z-10 h-20 w-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* Tagline */}
      <motion.p
        className="relative z-10 mt-5 text-[10px] font-semibold tracking-[0.24em] uppercase select-none"
        style={{ color: '#01232a' }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 0.65, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        AI-Powered Project Management
      </motion.p>

      {/* Shimmer progress bar */}
      <motion.div
        className="relative z-10 mt-10 h-[2px] w-36 rounded-full overflow-hidden"
        style={{ background: 'rgba(40,199,147,0.15)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="absolute inset-y-0 w-16 rounded-full"
          style={{
            background: 'linear-gradient(to right, transparent, #28C793, transparent)',
          }}
          animate={{ x: ['-64px', '144px'] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Optional message */}
      {message && (
        <motion.p
          className="relative z-10 mt-5 text-xs select-none"
          style={{ color: '#01232a', opacity: 0.45 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ delay: 0.6 }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  )
}

export default AppLoader
