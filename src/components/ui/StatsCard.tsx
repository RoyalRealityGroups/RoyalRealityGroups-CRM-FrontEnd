/**
 * StatsCard Component
 *
 * Professional KPI card with trend indicators and animations
 * Enterprise-grade design for dashboard metrics with MUI styling
 */
import { motion } from 'framer-motion'
import type { SvgIconComponent } from '@mui/icons-material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'
import { Box, Typography, Paper, Skeleton } from '@mui/material'

interface StatsCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon: SvgIconComponent
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  onClick?: () => void
  loading?: boolean
}

const colorStyles = {
  primary: {
    iconBg: 'primary.lighter',
    iconColor: 'primary.main',
    gradient: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
  },
  secondary: {
    iconBg: 'secondary.lighter',
    iconColor: 'secondary.main',
    gradient: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.05) 100%)',
  },
  success: {
    iconBg: 'success.lighter',
    iconColor: 'success.main',
    gradient: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%)',
  },
  warning: {
    iconBg: 'warning.lighter',
    iconColor: 'warning.main',
    gradient: 'linear-gradient(135deg, rgba(237, 108, 2, 0.1) 0%, rgba(237, 108, 2, 0.05) 100%)',
  },
  error: {
    iconBg: 'error.lighter',
    iconColor: 'error.main',
    gradient: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(211, 47, 47, 0.05) 100%)',
  },
  info: {
    iconBg: 'info.lighter',
    iconColor: 'info.main',
    gradient: 'linear-gradient(135deg, rgba(2, 136, 209, 0.1) 0%, rgba(2, 136, 209, 0.05) 100%)',
  },
}

const StatsCard = ({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  color = 'primary',
  onClick,
  loading = false,
}: StatsCardProps) => {
  const styles = colorStyles[color]
  const isPositiveTrend = trend !== undefined && trend >= 0
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown

  if (loading) {
    return (
      <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="text" width={100} height={20} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
        <Skeleton variant="text" width={80} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={120} height={16} />
      </Paper>
    )
  }

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      sx={{
        p: 3,
        border: 1,
        borderColor: 'divider',
        background: styles.gradient,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? {
          boxShadow: 3,
        } : {},
      }}
    >
      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" fontWeight="medium" color="text.secondary">
            {title}
          </Typography>
          <Box
            sx={{
              bgcolor: styles.iconBg,
              color: styles.iconColor,
              p: 1,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </Box>
        </Box>

        {/* Value */}
        <Typography variant="h4" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>

        {/* Trend */}
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendIcon
              sx={{
                fontSize: 16,
                color: isPositiveTrend ? 'success.main' : 'error.main',
              }}
            />
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{
                color: isPositiveTrend ? 'success.main' : 'error.main',
              }}
            >
              {isPositiveTrend ? '+' : ''}
              {trend}%
            </Typography>
            {trendLabel && (
              <Typography variant="caption" color="text.secondary">
                {trendLabel}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Hover Effect */}
      {onClick && (
        <Box
          component={motion.div}
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'transparent',
            transition: 'background-color 0.2s',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
          whileHover={{ scale: 1 }}
        />
      )}
    </Paper>
  )
}

export default StatsCard
