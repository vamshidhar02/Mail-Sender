/** Values shared by the API and (later) the dashboard so limits never drift. */
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 25,
  maxLimit: 200,
} as const;

export const TEMPLATE_VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_.]+)\s*}}/g;

/** Merge tags always available, on top of a contact's custom attributes. */
export const RESERVED_MERGE_TAGS = ['email', 'firstName', 'lastName'] as const;
