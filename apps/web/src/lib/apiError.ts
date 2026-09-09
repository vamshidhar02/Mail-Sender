import type { ApiErrorBody } from '@mailer/shared';

/**
 * RTK Query surfaces errors as unknown; the API always answers with the shape
 * in ApiErrorBody, so pull out something worth showing the user.
 */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof error !== 'object' || error === null) return fallback;

  const data = (error as { data?: ApiErrorBody }).data;
  if (!data) return fallback;

  const { message } = data;
  if (Array.isArray(message)) return message.join(', ');
  return message || fallback;
}
