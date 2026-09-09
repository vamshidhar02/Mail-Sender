import type {
  Contact,
  ContactList,
  ContactQuery,
  CreateContactRequest,
  Paginated,
  PaginationQuery,
  UpdateContactRequest,
} from '@mailer/shared';
import { baseApi } from './baseApi';

export const contactsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContacts: builder.query<Paginated<Contact>, ContactQuery>({
      query: (params) => ({ url: '/contacts', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Contact' as const, id })),
              { type: 'Contact' as const, id: 'LIST' },
            ]
          : [{ type: 'Contact' as const, id: 'LIST' }],
    }),
    createContact: builder.mutation<Contact, CreateContactRequest>({
      query: (body) => ({ url: '/contacts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }, 'List'],
    }),
    updateContact: builder.mutation<Contact, { id: string; body: UpdateContactRequest }>({
      query: ({ id, body }) => ({ url: '/contacts/' + id, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }, 'List'],
    }),
    unsubscribeContact: builder.mutation<Contact, string>({
      query: (id) => ({ url: '/contacts/' + id + '/unsubscribe', method: 'POST' }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),
    deleteContact: builder.mutation<void, string>({
      query: (id) => ({ url: '/contacts/' + id, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }, 'List'],
    }),

    getLists: builder.query<Paginated<ContactList>, PaginationQuery>({
      query: (params) => ({ url: '/lists', params }),
      providesTags: ['List'],
    }),
    createList: builder.mutation<ContactList, { name: string; description?: string }>({
      query: (body) => ({ url: '/lists', method: 'POST', body }),
      invalidatesTags: ['List'],
    }),
    deleteList: builder.mutation<void, string>({
      query: (id) => ({ url: '/lists/' + id, method: 'DELETE' }),
      invalidatesTags: ['List', { type: 'Contact', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useUnsubscribeContactMutation,
  useDeleteContactMutation,
  useGetListsQuery,
  useCreateListMutation,
  useDeleteListMutation,
} = contactsApi;
