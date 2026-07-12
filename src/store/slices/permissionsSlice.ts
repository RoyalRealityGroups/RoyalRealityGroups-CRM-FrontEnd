import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface PermissionsState {
  permissions: string[];
  isLoading: boolean;
}

const initialState: PermissionsState = {
  permissions: [],
  isLoading: false,
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    fetchPermissionsStart: (state) => {
      state.isLoading = true;
    },
    fetchPermissionsSuccess: (state, action: PayloadAction<string[]>) => {
      state.isLoading = false;
      state.permissions = action.payload;
    },
    fetchPermissionsFailure: (state) => {
      state.isLoading = false;
    },
    clearPermissions: (state) => {
      state.permissions = [];
      state.isLoading = false;
    },
  },
});

export const {
  fetchPermissionsStart,
  fetchPermissionsSuccess,
  fetchPermissionsFailure,
  clearPermissions,
} = permissionsSlice.actions;

export default permissionsSlice.reducer;
