/** Single source of truth for paths so links and nav highlighting cannot drift. */
export const ROUTES = {
  dashboard: '/',
  campaigns: '/campaigns',
  campaignNew: '/campaigns/new',
  campaignDetail: (id = ':id') => '/campaigns/' + id,
  contacts: '/contacts',
  lists: '/lists',
  templates: '/templates',
  templateNew: '/templates/new',
  templateDetail: (id = ':id') => '/templates/' + id,
} as const;
