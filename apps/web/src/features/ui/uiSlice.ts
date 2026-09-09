import { createSlice } from '@reduxjs/toolkit';

export interface UiState {
  siderCollapsed: boolean;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { siderCollapsed: false } as UiState,
  reducers: {
    siderToggled(state) {
      state.siderCollapsed = !state.siderCollapsed;
    },
  },
  selectors: {
    selectSiderCollapsed: (state) => state.siderCollapsed,
  },
});

export const { siderToggled } = uiSlice.actions;
export const { selectSiderCollapsed } = uiSlice.selectors;
export default uiSlice.reducer;
