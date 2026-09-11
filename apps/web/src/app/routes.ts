/** Single source of truth for paths so links and nav highlighting cannot drift. */
export const ROUTES = {
  login: '/login',
  /** Where the API redirects back to after Google, carrying the token in the fragment. */
  authCallback: '/auth/callback',
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
