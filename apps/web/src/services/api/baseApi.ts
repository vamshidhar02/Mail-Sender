import { createApi, fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { API_BASE_URL } from '@/lib/apiBase';
import { signedOut } from '@/features/auth/authSlice';

/**
 * Endpoints are injected per feature (see the sibling files) so this module
 * stays free of domain knowledge and the bundle can split cleanly.
 *
 * The dev server proxies /api to the Nest app on :4000 (see vite.config.ts).
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Typed structurally rather than with RootState: store.ts imports this
    // module, so importing its types back would close a cycle.
    const { token } = (getState() as { auth: { token: string | null } }).auth;
    if (token) headers.set('Authorization', 'Bearer ' + token);
    return headers;
  },
});

/**
 * Treats any 401 as the end of the session.
 *
 * There is no refresh token by design - the API is stateless and the only way
 * back in is another trip through Google - so an expired token, a revoked one
 * and a rotated JWT_SECRET all land here and all mean "sign in again". Clearing
 * the token flips RequireAuth over to the login page on the next render.
 */
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) api.dispatch(signedOut());
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Campaign', 'CampaignStats', 'Contact', 'List', 'Template', 'Session'],
  endpoints: () => ({}),
});
