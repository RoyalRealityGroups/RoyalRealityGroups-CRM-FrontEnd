/**
 * ActivityFeed Component
 *
 * Real-time activity stream showing recent actions
 * Enterprise-grade timeline design with MUI styling
 */
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  Description as FileText,
  People as Users,
  CreateNewFolder as FolderPlus,
  CheckCircle as CheckCircle2,
  Error as AlertCircle,
  Edit,
  Delete as Trash2,
  PersonAdd as UserPlus,
} from '@mui/icons-material'
import { Box, Typography, Avatar, Skeleton, Stack } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'

export interface Activity {
  id: string
  type: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected' | 'invited' | 'joined'
  user: {
    name: string
    email: string
    avatar?: string
  }
  entity: string
  entityName: string
  timestamp: string | Date
  description?: string
}

interface ActivityFeedProps {
  activities: Activity[]
  loading?: boolean
  maxItems?: number
  onLoadMore?: () => void
  showLoadMore?: boolean
}

const activityIcons: Record<Activity['type'], SvgIconComponent> = {
  created: FolderPlus,
  updated: Edit,
  deleted: Trash2,
  approved: CheckCircle2,
  rejected: AlertCircle,
  invited: UserPlus,
  joined: Users,
}

const activityColors: Record<Activity['type'], { bg: string; color: string }> = {
  created: { bg: 'rgba(46, 125, 50, 0.08)', color: 'success.main' },
  updated: { bg: 'rgba(2, 136, 209, 0.08)', color: 'info.main' },
  deleted: { bg: 'rgba(211, 47, 47, 0.08)', color: 'error.main' },
  approved: { bg: 'rgba(46, 125, 50, 0.08)', color: 'success.main' },
  rejected: { bg: 'rgba(211, 47, 47, 0.08)', color: 'error.main' },
  invited: { bg: 'rgba(2, 136, 209, 0.08)', color: 'info.main' },
  joined: { bg: 'rgba(46, 125, 50, 0.08)', color: 'success.main' },
}

const activityLabels: Record<Activity['type'], string> = {
  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
  approved: 'approved',
  rejected: 'rejected',
  invited: 'invited',
  joined: 'joined',
}

const ActivityFeed = ({
  activities,
  loading = false,
  maxItems = 10,
  onLoadMore,
  showLoadMore = false,
}: ActivityFeedProps) => {
  const displayedActivities = activities.slice(0, maxItems)

  if (loading) {
    return (
      <Stack spacing={2}>
        {[...Array(5)].map((_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="75%" />
              <Skeleton variant="text" width="50%" />
            </Box>
          </Box>
        ))}
      </Stack>
    )
  }

  if (activities.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            bgcolor: 'grey.100',
            borderRadius: 1,
            mb: 2,
          }}
        >
          <FileText sx={{ fontSize: 32, color: 'grey.400' }} />
        </Box>
        <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
          No activity yet
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Activity will appear here as you and your team work
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Activity List */}
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {displayedActivities.map((activity, activityIdx) => {
          const Icon = activityIcons[activity.type]
          const colors = activityColors[activity.type]
          const label = activityLabels[activity.type]

          return (
            <Box
              component={motion.li}
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: activityIdx * 0.05 }}
              sx={{ position: 'relative', pb: activityIdx !== displayedActivities.length - 1 ? 3 : 0 }}
            >
              {/* Timeline connector */}
              {activityIdx !== displayedActivities.length - 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 40,
                    left: 20,
                    width: 2,
                    height: 'calc(100% - 40px)',
                    bgcolor: 'divider',
                  }}
                />
              )}

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {/* Avatar with Icon */}
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                  {activity.user.avatar ? (
                    <Avatar
                      src={activity.user.avatar}
                      alt={activity.user.name}
                      sx={{ width: 40, height: 40, border: 2, borderColor: 'background.paper' }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'grey.200',
                        color: 'grey.600',
                        border: 2,
                        borderColor: 'background.paper',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {activity.user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  )}

                  {/* Icon Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      bgcolor: colors.bg,
                      color: colors.color,
                      p: 0.5,
                      borderRadius: '50%',
                      border: 2,
                      borderColor: 'background.paper',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon sx={{ fontSize: 12 }} />
                  </Box>
                </Box>

                {/* Content */}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box>
                    <Typography variant="body2" component="div">
                      <Typography component="span" fontWeight="medium" color="text.primary">
                        {activity.user.name}
                      </Typography>
                      <Typography component="span" color="text.secondary">
                        {' '}{label}{' '}
                      </Typography>
                      <Typography component="span" fontWeight="medium" color="text.primary">
                        {activity.entityName}
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </Typography>
                  </Box>
                  {activity.description && (
                    <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                      {activity.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )
        })}
      </Box>

      {/* Load More Button */}
      {showLoadMore && activities.length > maxItems && (
        <Box
          component="button"
          onClick={onLoadMore}
          sx={{
            width: '100%',
            py: 1,
            mt: 2,
            border: 'none',
            bgcolor: 'transparent',
            color: 'primary.main',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 0.2s',
            '&:hover': {
              color: 'primary.dark',
            },
          }}
        >
          Load more activity
        </Box>
      )}
    </Box>
  )
}

export default ActivityFeed
