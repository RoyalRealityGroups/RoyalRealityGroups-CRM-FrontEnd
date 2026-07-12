import { useState, useEffect } from 'react'
import { EmojiEvents as Award } from '@mui/icons-material'
import { gamificationApi } from '../../../api/gamification';
import type { UserBadge } from '../../../api/gamification';

const RecentBadgesWidget = ({ widget: _widget }: { widget: any }) => {
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gamificationApi.myBadges({ page_size: 3 }).then((data) => {
      setBadges(data.results || data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />

  if (!badges.length) {
    return (
      <div className="p-4 text-center text-sm text-gray-400 dark:text-gray-500">
        <Award className="w-8 h-8 mx-auto mb-1 opacity-30" />
        No badges earned yet
      </div>
    )
  }

  return (
    <div className="p-4 space-y-2">
      {badges.map((ub) => (
        <div key={ub.id} className="flex items-center gap-3">
          <span className="text-xl">{ub.badge.icon}</span>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{ub.badge.name}</p>
            <p className="text-xs text-gray-400">{new Date(ub.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RecentBadgesWidget
