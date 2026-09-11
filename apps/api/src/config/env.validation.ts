import { z } from 'zod';

/**
 * Fail fast at boot rather than at the first send - a missing DATABASE_URL
 * should never surface as a runtime 500.
 */
const envSchema = z.object({

  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z
    .string()
    .default('')
    .refine(
      (value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean)
          .every((origin) => /^https?:\/\/[^/?#\s]+[/]*$/.test(origin)),
      'Each origin must be http(s)://host[:port], comma-separated, with no path',
    ),
  DATABASE_URL: z.string().url(),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  WEB_APP_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'Use at least 32 characters (openssl rand -base64 32)'),
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),
  // Optional allowlist. Blank accepts any Google account.
  AUTH_ALLOWED_EMAILS: z.string().default(''),
  MAIL_TRANSPORT: z.enum(['file', 'smtp']).default('file'),
  SMTP_HOST: z.string().min(1).default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  // Not z.email(): the local Mailpit default (no-reply@localhost) has no TLD.
  MAIL_FROM_ADDRESS: z.string().regex(/^[^\s@]+@[^\s@]+$/, 'Must be an email address'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => '  - ' + issue.path.join('.') + ': ' + issue.message)
      .join('\n');
    throw new Error('Invalid environment configuration:\n' + issues);
  }
  return { ...config, ...result.data };
}
