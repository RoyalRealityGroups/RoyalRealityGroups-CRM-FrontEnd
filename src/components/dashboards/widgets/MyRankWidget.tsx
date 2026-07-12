import { useState, useEffect } from 'react'
import { EmojiEvents as Trophy } from '@mui/icons-material'
import { gamificationApi } from '../../../api/gamification';

const MyRankWidget = ({ widget: _widget }: { widget: any }) => {
  const [rank, setRank] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gamificationApi.getMyPosition('week').then((data) => {
      setRank(data.user_rank)
      setTotal(data.total_users)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
        <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your Rank</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {rank ? `#${rank}` : '\u2014'}
        </p>
        <p className="text-xs text-gray-400">of {total} this week</p>
      </div>
    </div>
  )
}

export default MyRankWidget
