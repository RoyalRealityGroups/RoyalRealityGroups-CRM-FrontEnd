import apiClient from './axios.config';

// ============================
// Types
// ============================

export interface PointRule {
  id: string
  code: string
  name: string
  description: string
  trigger_type: string
  points_value: number
  base_points: number
  priority: number
  conditions: Record<string, any> | null
  role_multipliers: Record<string, any> | null
  requires_approval: boolean
  is_active: boolean
  ai_model_name: string | null
  ai_prompt_template: string | null
  created_at: string
  updated_at: string
}

export interface PointTransaction {
  id: string
  user: string
  user_name?: string
  rule: string | null
  rule_name?: string
  points: number
  base_points: number
  role_multiplier: number
  reason: string
  trigger_type: string
  trigger_id: string | null
  trigger_data: Record<string, any> | null
  status: string
  transaction_date: string
  created_at: string
}

export interface UserPoints {
  id: string
  user: string
  user_name: string
  user_email: string
  total_points: number
  pending_points: number
  today_points: number
  week_points: number
  month_points: number
  quarter_points: number
  overall_rank: number
  today_rank: number
  week_rank: number
  month_rank: number
  quarter_rank: number
  total_transactions: number
  total_badges_earned: number
  current_streak_days: number
  longest_streak_days: number
  last_activity_date: string | null
  ai_performance_score: number
  ai_trend: string
}

export interface Badge {
  id: string
  code: string
  name: string
  description: string
  icon: string
  color: string
  badge_type: 'achievement' | 'milestone' | 'tiered' | 'special' | 'manager_awarded'
  tier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  parent_badge: string | null
  unlock_criteria: Record<string, any>
  points_reward: number
  is_active: boolean
  is_secret: boolean
  total_awarded: number
  rarity_score: number
  created_at: string
}

export interface UserBadge {
  id: string
  user: string
  user_name?: string
  badge: Badge
  awarded_by: string | null
  awarded_by_name?: string
  award_reason: string
  points_earned: number
  trigger_data: Record<string, any> | null
  created_at: string
}

export interface BadgeProgress {
  id: string
  code: string
  name: string
  description: string
  icon: string
  color: string
  badge_type: string
  tier: string
  points_reward: number
  is_earned: boolean
  earned_at: string | null
  progress: Record<string, { current: number; required: number; percentage: number }>
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  user_email?: string
  points: number
  total_points: number
  badges_count: number
  streak_days: number
}

export interface LeaderboardResponse {
  period: string
  entries: LeaderboardEntry[]
  total_users: number
  updated_at: string
}

export interface UserPositionResponse {
  period: string
  user_rank: number | null
  user_points: number
  total_users: number
  neighbors: Array<{
    rank: number
    user_id: string
    user_name: string
    points: number
    is_current_user?: boolean
  }>
}

export interface TopMoversResponse {
  period: string
  entries: Array<{
    user_id: string
    user_name: string
    points_gained: number
    total_points: number
    rank: number
  }>
}

export type LeaderboardPeriod = 'today' | 'week' | 'month' | 'quarter' | 'overall'

// ============================
// API Methods
// ============================

const gamificationApi = {
  // --- Module Status ---
  getModuleStatus: async (): Promise<{ enabled: boolean }> => {
    const response = await apiClient.get('/gamification/module-status/')
    return response.data
  },
  setModuleEnabled: async (enabled: boolean): Promise<{ enabled: boolean }> => {
    const response = await apiClient.patch('/gamification/module-status/', { enabled })
    return response.data
  },

  // --- Point Rules (admin CRUD) ---
  listPointRules: async (params?: Record<string, any>) => {
    const response = await apiClient.get('/gamification/point-rules/', { params })
    return response.data
  },
  getPointRule: async (id: string) => {
    const response = await apiClient.get(`/gamification/point-rules/${id}/`)
    return response.data
  },
  createPointRule: async (data: Partial<PointRule>) => {
    const response = await apiClient.post('/gamification/point-rules/', data)
    return response.data
  },
  updatePointRule: async (id: string, data: Partial<PointRule>) => {
    const response = await apiClient.put(`/gamification/point-rules/${id}/`, data)
    return response.data
  },
  deletePointRule: async (id: string) => {
    const response = await apiClient.delete(`/gamification/point-rules/${id}/`)
    return response.data
  },

  // --- Point Transactions ---
  myHistory: async (params?: Record<string, any>) => {
    const response = await apiClient.get('/gamification/point-transactions/my-history/', { params })
    return response.data
  },

  // --- User Points ---
  myStats: async (): Promise<UserPoints> => {
    const response = await apiClient.get('/gamification/user-points/my-stats/')
    return response.data
  },

  // --- Badges (admin CRUD) ---
  listBadges: async (params?: Record<string, any>) => {
    const response = await apiClient.get('/gamification/badges/', { params })
    return response.data
  },
  getBadge: async (id: string) => {
    const response = await apiClient.get(`/gamification/badges/${id}/`)
    return response.data
  },
  createBadge: async (data: Partial<Badge>) => {
    const response = await apiClient.post('/gamification/badges/', data)
    return response.data
  },
  updateBadge: async (id: string, data: Partial<Badge>) => {
    const response = await apiClient.put(`/gamification/badges/${id}/`, data)
    return response.data
  },
  deleteBadge: async (id: string) => {
    const response = await apiClient.delete(`/gamification/badges/${id}/`)
    return response.data
  },

  // --- User Badges ---
  myBadges: async (params?: Record<string, any>) => {
    const response = await apiClient.get('/gamification/user-badges/my-badges/', { params })
    return response.data
  },
  availableBadges: async (): Promise<BadgeProgress[]> => {
    const response = await apiClient.get('/gamification/user-badges/available/')
    return response.data
  },
  awardBadge: async (data: { badge: string; user: string; reason: string }) => {
    const response = await apiClient.post('/gamification/user-badges/award/', data)
    return response.data
  },

  // --- Leaderboard ---
  getLeaderboard: async (params?: { period?: LeaderboardPeriod; limit?: number; offset?: number }): Promise<LeaderboardResponse> => {
    const response = await apiClient.get('/gamification/leaderboard/current/', { params })
    return response.data
  },
  getMyPosition: async (period?: LeaderboardPeriod): Promise<UserPositionResponse> => {
    const response = await apiClient.get('/gamification/leaderboard/my-position/', { params: { period } })
    return response.data
  },
  getTopMovers: async (params?: { period?: LeaderboardPeriod; limit?: number }): Promise<TopMoversResponse> => {
    const response = await apiClient.get('/gamification/leaderboard/top-movers/', { params })
    return response.data
  },
}

export { gamificationApi }
