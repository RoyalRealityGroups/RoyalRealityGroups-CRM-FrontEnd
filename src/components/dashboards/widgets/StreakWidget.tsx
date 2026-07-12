import { useState, useEffect } from 'react'
import { LocalFireDepartment as Flame } from '@mui/icons-material'
import { gamificationApi } from '../../../api/gamification';

const StreakWidget = ({ widget: _widget }: { widget: any }) => {
  const [streak, setStreak] = useState(0)
  const [longest, setLongest] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gamificationApi.myStats().then((data) => {
      setStreak(data.current_streak_days)
      setLongest(data.longest_streak_days)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />

  return (
    <div className="flex items-center gap-4 p-4">
      <div className={`p-3 rounded-xl ${streak > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
        <Flame className={`w-6 h-6 ${streak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Streak</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{streak} days</p>
        {longest > 0 && <p className="text-xs text-gray-400">Best: {longest} days</p>}
      </div>
    </div>
  )
}

export default StreakWidget
