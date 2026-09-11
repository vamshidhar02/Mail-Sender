import type { AuthSession } from '@mailer/shared';

import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Validates the stored token against the API. A stored token proves only
     * that someone signed in once on this browser; this is what proves it is
     * still good, and a 401 here is what clears it.
     */
    getSession: builder.query<AuthSession, void>({
      query: () => '/auth/me',
      providesTags: ['Session'],
    }),
  }),
});

export const { useGetSessionQuery } = authApi;
