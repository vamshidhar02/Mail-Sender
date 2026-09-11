/**
 * Where the API lives, as baked in at build time by Vite.
 *
 * Falls back to the relative `/api`, which the dev server proxies (see
 * vite.config.ts). Vite inlines VITE_* at build time, so changing this in
 * Vercel needs a redeploy, not just a settings save.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/[/]+$/, '');

/**
 * The sign-in entry point. This must be reached with a full page navigation
 * rather than fetch: it answers with a 302 to Google's consent screen, which
 * only the browser itself can follow.
 */
export const GOOGLE_SIGN_IN_URL = API_BASE_URL + '/auth/google';
