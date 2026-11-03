import React, {
  createContext, useContext, useState, useEffect, useMemo, useCallback,
} from 'react';
import { ThemeProvider } from '@mui/material';
import { createAppTheme } from '../theme/theme';
import {
  type ThemeTokens, DEFAULT_THEME_TOKENS, THEME_CACHE_KEY, loadGoogleFont,
} from '../theme/themeTokens';
import { themeApi } from '../api/theme.api';

interface ThemeSettingsContextValue {
  tokens: ThemeTokens;                 // currently applied tokens (saved)
  isLoading: boolean;
  /** Apply tokens live without saving — used by the Appearance settings preview. */
  setPreview: (tokens: ThemeTokens | null) => void;
  /** Persist tokens to the backend and apply them app-wide. */
  save: (tokens: Partial<ThemeTokens>) => Promise<ThemeTokens>;
  /** Reset to factory defaults (backend) and apply. */
  reset: () => Promise<ThemeTokens>;
  /** Re-fetch from the backend (e.g. after login). */
  refresh: () => Promise<void>;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | null>(null);

function readCache(): ThemeTokens {
  try {
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    if (raw) return { ...DEFAULT_THEME_TOKENS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_THEME_TOKENS;
}

function writeCache(tokens: ThemeTokens) {
  try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(tokens)); } catch { /* ignore */ }
}

export const ThemeSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start from cache so the first paint already uses the saved theme.
  const [saved, setSaved] = useState<ThemeTokens>(() => readCache());
  const [preview, setPreviewState] = useState<ThemeTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load fonts for whatever is active
  const active = preview ?? saved;
  useEffect(() => {
    loadGoogleFont(active.heading_font);
    loadGoogleFont(active.body_font);
  }, [active.heading_font, active.body_font]);

  const fetchTokens = useCallback(async () => {
    try {
      const data = await themeApi.get();
      const merged = { ...DEFAULT_THEME_TOKENS, ...data };
      setSaved(merged);
      writeCache(merged);
    } catch {
      // keep cache / defaults on failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const setPreview = useCallback((tokens: ThemeTokens | null) => {
    setPreviewState(tokens);
    if (tokens) {
      loadGoogleFont(tokens.heading_font);
      loadGoogleFont(tokens.body_font);
    }
  }, []);

  const save = useCallback(async (patch: Partial<ThemeTokens>) => {
    const updated = await themeApi.update(patch);
    const merged = { ...DEFAULT_THEME_TOKENS, ...updated };
    setSaved(merged);
    writeCache(merged);
    setPreviewState(null);
    return merged;
  }, []);

  const reset = useCallback(async () => {
    const data = await themeApi.reset();
    const merged = { ...DEFAULT_THEME_TOKENS, ...data };
    setSaved(merged);
    writeCache(merged);
    setPreviewState(null);
    return merged;
  }, []);

  const refresh = useCallback(async () => { await fetchTokens(); }, [fetchTokens]);

  // The theme currently rendered = preview if previewing, else saved.
  const muiTheme = useMemo(() => createAppTheme(active), [active]);

  const value: ThemeSettingsContextValue = {
    tokens: saved,
    isLoading,
    setPreview,
    save,
    reset,
    refresh,
  };

  return (
    <ThemeSettingsContext.Provider value={value}>
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </ThemeSettingsContext.Provider>
  );
};

export const useThemeSettings = (): ThemeSettingsContextValue => {
  const ctx = useContext(ThemeSettingsContext);
  if (!ctx) throw new Error('useThemeSettings must be used within ThemeSettingsProvider');
  return ctx;
};
