import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { MenuItem } from '../../types/menu.types';

interface MenuState {
  menus: MenuItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MenuState = {
  menus: [],
  isLoading: false,
  error: null,
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    fetchMenuStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchMenuSuccess: (state, action: PayloadAction<MenuItem[]>) => {
      state.isLoading = false;
      state.menus = action.payload;
      state.error = null;
    },
    fetchMenuFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearMenu: (state) => {
      state.menus = [];
      state.error = null;
    },
  },
});

export const {
  fetchMenuStart,
  fetchMenuSuccess,
  fetchMenuFailure,
  clearMenu,
} = menuSlice.actions;

export default menuSlice.reducer;
