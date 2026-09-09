import type {
  Campaign,
  CampaignQuery,
  CampaignStats,
  CreateCampaignRequest,
  Paginated,
  SendCampaignResult,
  SendTestRequest,
  UpdateCampaignRequest,
} from '@mailer/shared';
import { baseApi } from './baseApi';

export const campaignsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCampaigns: builder.query<Paginated<Campaign>, CampaignQuery>({
      query: (params) => ({ url: '/campaigns', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Campaign' as const, id })),
              { type: 'Campaign' as const, id: 'LIST' },
            ]
          : [{ type: 'Campaign' as const, id: 'LIST' }],
    }),
    getCampaign: builder.query<Campaign, string>({
      query: (id) => '/campaigns/' + id,
      providesTags: (_r, _e, id) => [{ type: 'Campaign', id }],
    }),
    getCampaignStats: builder.query<CampaignStats, string>({
      query: (id) => '/campaigns/' + id + '/stats',
      providesTags: (_r, _e, id) => [{ type: 'CampaignStats', id }],
    }),
    createCampaign: builder.mutation<Campaign, CreateCampaignRequest>({
      query: (body) => ({ url: '/campaigns', method: 'POST', body }),
      invalidatesTags: [{ type: 'Campaign', id: 'LIST' }],
    }),
    updateCampaign: builder.mutation<Campaign, { id: string; body: UpdateCampaignRequest }>({
      query: ({ id, body }) => ({ url: '/campaigns/' + id, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Campaign', id }, { type: 'Campaign', id: 'LIST' }],
    }),
    deleteCampaign: builder.mutation<void, string>({
      query: (id) => ({ url: '/campaigns/' + id, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Campaign', id: 'LIST' }],
    }),
    sendCampaign: builder.mutation<SendCampaignResult, string>({
      query: (id) => ({ url: '/campaigns/' + id + '/send', method: 'POST' }),
      // Status and counters both move, so refresh the row and its stats.
      invalidatesTags: (_r, _e, id) => [
        { type: 'Campaign', id },
        { type: 'Campaign', id: 'LIST' },
        { type: 'CampaignStats', id },
      ],
    }),
    sendTest: builder.mutation<{ sent: number }, { id: string; body: SendTestRequest }>({
      query: ({ id, body }) => ({ url: '/campaigns/' + id + '/test', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useGetCampaignQuery,
  useGetCampaignStatsQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
  useSendCampaignMutation,
  useSendTestMutation,
} = campaignsApi;
