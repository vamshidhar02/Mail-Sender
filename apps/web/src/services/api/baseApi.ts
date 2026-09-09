import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Endpoints are injected per feature (see the sibling files) so this module
 * stays free of domain knowledge and the bundle can split cleanly.
 *
 * The dev server proxies /api to the Nest app on :4000 (see vite.config.ts).
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL ?? '/api' }),
  tagTypes: ['Campaign', 'CampaignStats', 'Contact', 'List', 'Template'],
  endpoints: () => ({}),
});
