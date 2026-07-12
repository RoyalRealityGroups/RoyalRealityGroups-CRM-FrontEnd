import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types/auth.types';
import { storage } from '../../utils/storage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  rememberMe: boolean;
}

const initialState: AuthState = {
  user: storage.getUser(),
  accessToken: storage.getAccessToken(),
  refreshToken: storage.getRefreshToken(),
  isAuthenticated: !!storage.getAccessToken(),
  isLoading: false,
  error: null,
  rememberMe: storage.getRememberMe(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; access: string; refresh: string; rememberMe?: boolean }>) => {
      state.isLoading = false;
      state.user = action.payload.user;
      console.log("Login success, user:", action.payload.user);
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isAuthenticated = true;
      state.rememberMe = action.payload.rememberMe || false;
      state.error = null;

      // Set remember_me FIRST so storage helper knows which storage to use
      if (action.payload.rememberMe !== undefined) {
        storage.setRememberMe(action.payload.rememberMe);
      }
      
      // Then store tokens and user (will use correct storage based on remember_me)
      storage.setAccessToken(action.payload.access);
      storage.setRefreshToken(action.payload.refresh);
      storage.setUser(action.payload.user);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;

      // Clear storage
      storage.clearAuth();
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      storage.setAccessToken(action.payload);
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      storage.setUser(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateAccessToken,
  setUser,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
