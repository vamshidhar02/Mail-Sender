import type {
  CreateTemplateRequest,
  Paginated,
  RenderPreviewRequest,
  RenderPreviewResponse,
  Template,
  TemplateQuery,
  UpdateTemplateRequest,
} from '@mailer/shared';
import { baseApi } from './baseApi';

export const templatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTemplates: builder.query<Paginated<Template>, TemplateQuery>({
      query: (params) => ({ url: '/templates', params }),
      providesTags: ['Template'],
    }),
    getTemplate: builder.query<Template, string>({
      query: (id) => '/templates/' + id,
      providesTags: (_r, _e, id) => [{ type: 'Template', id }],
    }),
    createTemplate: builder.mutation<Template, CreateTemplateRequest>({
      query: (body) => ({ url: '/templates', method: 'POST', body }),
      invalidatesTags: ['Template'],
    }),
    updateTemplate: builder.mutation<Template, { id: string; body: UpdateTemplateRequest }>({
      query: ({ id, body }) => ({ url: '/templates/' + id, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Template', id }, 'Template'],
    }),
    deleteTemplate: builder.mutation<void, string>({
      query: (id) => ({ url: '/templates/' + id, method: 'DELETE' }),
      invalidatesTags: ['Template'],
    }),
    previewTemplate: builder.mutation<
      RenderPreviewResponse,
      { id: string; body: RenderPreviewRequest }
    >({
      query: ({ id, body }) => ({ url: '/templates/' + id + '/preview', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetTemplatesQuery,
  useGetTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  usePreviewTemplateMutation,
} = templatesApi;
