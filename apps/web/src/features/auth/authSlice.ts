import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const TOKEN_STORAGE_KEY = 'mailer.auth.token';

/**
 * Reading storage can throw outright, not just return null - Safari in private
 * mode and browsers configured to block site data both do it - so a failure
 * here has to mean "signed out", never "crash on boot".
 */
export function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Non-fatal: the session simply will not survive a reload.
  }
}

export interface AuthState {
  /** The bearer token, or null when signed out. */
  token: string | null;
  /** Set when a sign-in attempt was rejected, so the login page can explain. */
  error: string | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: readStoredToken(), error: null } as AuthState,
  reducers: {
    signedIn(state, action: PayloadAction<string>) {
      state.token = action.payload;
      state.error = null;
    },
    /**
     * Dispatched both by the sign-out button and by baseApi when any request
     * comes back 401 - an expired token and a rotated JWT_SECRET look identical
     * from here, and both mean the same thing.
     */
    signedOut(state) {
      state.token = null;
    },
    signInFailed(state, action: PayloadAction<string>) {
      state.token = null;
      state.error = action.payload;
    },
    errorDismissed(state) {
      state.error = null;
    },
  },
  selectors: {
    selectToken: (state) => state.token,
    selectIsAuthenticated: (state) => state.token !== null,
    selectAuthError: (state) => state.error,
  },
});

export const { signedIn, signedOut, signInFailed, errorDismissed } = authSlice.actions;
export const { selectToken, selectIsAuthenticated, selectAuthError } = authSlice.selectors;
export default authSlice.reducer;
