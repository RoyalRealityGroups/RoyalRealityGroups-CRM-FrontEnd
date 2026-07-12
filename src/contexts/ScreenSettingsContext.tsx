/**
 * Screen Settings Context
 *
 * Provides global access to screen settings for conditional UI rendering.
 * Loads settings once on mount and exposes convenient flags for feature toggles.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { useAppSelector } from '../store/hooks';
import { screenSettingsApi, type SupportScreenSettings, type TasksScreenSettings, type GoalsScreenSettings } from '../api/screenSettings'
import { gamificationApi } from '../api/gamification'

// ============ TYPES ============

export interface ScreenSettingsContextType {
  // Settings objects
  supportSettings: SupportScreenSettings | null
  tasksSettings: TasksScreenSettings | null
  goalsSettings: GoalsScreenSettings | null

  // Feature flags (convenient access to key settings)
  supportEnabled: boolean
  sprintEnabled: boolean // Can be added when needed
  gamificationEnabled: boolean
  goalsEnabled: boolean

  // State
  loading: boolean
  error: string | null

  // Actions
  //refreshSettings: () => Promise<void>
}

// ============ CONTEXT ============

const ScreenSettingsContext = createContext<ScreenSettingsContextType | undefined>(undefined)

// ============ PROVIDER ============

export const ScreenSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [supportSettings, setSupportSettings] = useState<SupportScreenSettings | null>(null)
  const [tasksSettings, setTasksSettings] = useState<TasksScreenSettings | null>(null)
  const [goalsSettings, setGoalsSettings] = useState<GoalsScreenSettings | null>(null)
  const [gamificationModuleEnabled, setGamificationModuleEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const isCustomerUser = (user as any)?.user_type === 'customer'

  // Load all screen settings
  const loadSettings = useCallback(async () => {
    if (!isAuthenticated || isCustomerUser) {
      console.debug('[ScreenSettingsContext] %s, clearing settings', !isAuthenticated ? 'Not authenticated' : 'Customer user')
      setSupportSettings(null)
      setTasksSettings(null)
      setGoalsSettings(null)
      setGamificationModuleEnabled(false)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.debug('[ScreenSettingsContext] Loading screen settings...')

      // Load all settings in parallel
      const [supportResponse, tasksResponse, gamificationResponse, goalsResponse] = await Promise.allSettled([
        screenSettingsApi.getSupportSettings(),
        screenSettingsApi.getTasksSettings(),
        gamificationApi.getModuleStatus(),
        screenSettingsApi.getGoalsSettings(),
      ])

      // Process Support settings
      if (supportResponse.status === 'fulfilled' && supportResponse.value.success) {
        setSupportSettings(supportResponse.value.data)
        console.debug('[ScreenSettingsContext] Support settings loaded, use_services:', supportResponse.value.data.use_services)
      } else {
        console.debug('[ScreenSettingsContext] Failed to load support settings:', supportResponse)
      }

      // Process Tasks settings
      if (tasksResponse.status === 'fulfilled' && tasksResponse.value.success) {
        setTasksSettings(tasksResponse.value.data)
        console.debug('[ScreenSettingsContext] Tasks settings loaded')
      } else {
        console.debug('[ScreenSettingsContext] Failed to load tasks settings:', tasksResponse)
      }

      // Process Gamification module status
      if (gamificationResponse.status === 'fulfilled') {
        setGamificationModuleEnabled(gamificationResponse.value.enabled)
        console.debug('[ScreenSettingsContext] Gamification module enabled:', gamificationResponse.value.enabled)
      } else {
        setGamificationModuleEnabled(false)
        console.debug('[ScreenSettingsContext] Gamification status check failed, defaulting to disabled')
      }

      // Process Goals settings
      if (goalsResponse.status === 'fulfilled' && goalsResponse.value.success) {
        setGoalsSettings(goalsResponse.value.data)
        console.debug('[ScreenSettingsContext] Goals settings loaded, goals_enabled:', goalsResponse.value.data.goals_enabled)
      } else {
        console.debug('[ScreenSettingsContext] Goals settings check failed, defaulting to enabled')
      }

      console.debug('[ScreenSettingsContext] All settings loaded')
    } catch (err) {
      console.error('[ScreenSettingsContext] Failed to load settings:', err)
      setError('Failed to load screen settings')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, isCustomerUser])

  // Refresh settings (force reload)
  // const refreshSettings = useCallback(async () => {
  //   await loadSettings()
  // }, [loadSettings])

  // Load settings on mount and auth change
  // useEffect(() => {
  //   loadSettings()
  // }, [loadSettings])

  // Clear settings on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setSupportSettings(null)
      setTasksSettings(null)
      setGoalsSettings(null)
      setGamificationModuleEnabled(false)
    }
  }, [isAuthenticated])

  // ============ FEATURE FLAGS ============

  // Support module enabled flag (from use_services setting)
  const supportEnabled = useMemo(() => {
    // Default to true if loading or no settings yet (optimistic)
    if (loading || !supportSettings) {
      return true
    }
    return supportSettings.use_services
  }, [loading, supportSettings])

  // Sprint feature enabled flag (can be added later when needed)
  const sprintEnabled = useMemo(() => {
    // Placeholder - can be implemented when sprint toggle is needed globally
    return true
  }, [])

  // Gamification module enabled flag
  const gamificationEnabled = useMemo(() => {
    return gamificationModuleEnabled
  }, [gamificationModuleEnabled])

  // Goals module enabled flag
  const goalsEnabled = useMemo(() => {
    // Default to true if loading or no settings yet (optimistic)
    if (loading || !goalsSettings) {
      return true
    }
    return goalsSettings.goals_enabled
  }, [loading, goalsSettings])

  // ============ CONTEXT VALUE ============

  const value = useMemo<ScreenSettingsContextType>(
    () => ({
      supportSettings,
      tasksSettings,
      goalsSettings,
      supportEnabled,
      sprintEnabled,
      gamificationEnabled,
      goalsEnabled,
      loading,
      error,
      //refreshSettings,
    }),
    [
      supportSettings,
      tasksSettings,
      goalsSettings,
      supportEnabled,
      sprintEnabled,
      gamificationEnabled,
      goalsEnabled,
      loading,
      error,
      //refreshSettings,
    ]
  )

  return (
    <ScreenSettingsContext.Provider value={value}>
      {children}
    </ScreenSettingsContext.Provider>
  )
}

// ============ HOOK ============

export const useScreenSettings = (): ScreenSettingsContextType => {
  const context = useContext(ScreenSettingsContext)
  if (!context) {
    throw new Error('useScreenSettings must be used within a ScreenSettingsProvider')
  }
  return context
}
