import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { baseApi } from '@/services/api/baseApi';
import authReducer, { persistToken, selectToken } from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  devTools: import.meta.env.DEV,
});

// Enables refetchOnFocus / refetchOnReconnect for every endpoint.
setupListeners(store.dispatch);

// Mirror the token into localStorage from here rather than from the slice, so
// the reducers stay pure. Every path that changes it - sign-in, sign-out, and
// baseApi reacting to a 401 - flows through this one subscription.
let lastToken = selectToken(store.getState());
store.subscribe(() => {
  const token = selectToken(store.getState());
  if (token === lastToken) return;
  lastToken = token;
  persistToken(token);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
