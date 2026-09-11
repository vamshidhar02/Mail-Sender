const toBool = (value: string | undefined, fallback = false) =>
  value === undefined ? fallback : ['1', 'true', 'yes'].includes(value.toLowerCase());

const toInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'production',
    // Hosted platforms (Render, Railway, Fly) inject PORT and expect the
    // process to bind it; API_PORT stays the local-development knob.
    port: toInt(process.env.PORT ?? process.env.API_PORT, 4000),
    prefix: process.env.API_PREFIX ?? 'api',
    corsOrigins: (process.env.CORS_ORIGINS ?? '')
      .split(',')

      .map((origin) => origin.trim().replace(/[/]+$/, ''))
      .filter(Boolean),
  },
  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      // Must match an Authorised redirect URI in the Google Cloud console
      // character for character, including the /api prefix and the scheme.
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/api/auth/google/callback',
    },
    jwt: {
      secret: process.env.JWT_SECRET ?? '',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    },
    // Where the browser is sent once a token is signed: the dashboard's
    // origin, not the API's. Trailing slashes stripped for the same reason
    // as corsOrigins above.
    webAppUrl: (process.env.WEB_APP_URL ?? 'http://localhost:5173').replace(/[/]+$/, ''),
    // Comma-separated addresses allowed to sign in. Blank - the default -
    // accepts any Google account.
    allowedEmails: (process.env.AUTH_ALLOWED_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  },
  mail: {
    /** 'file' writes .eml files to disk (no server needed); 'smtp' really sends. */
    transport: (process.env.MAIL_TRANSPORT ?? 'file').toLowerCase(),
    outputDir: process.env.MAIL_OUTPUT_DIR ?? './storage/mail',
    fromName: process.env.MAIL_FROM_NAME ?? 'Mail Sender',
    fromAddress: process.env.MAIL_FROM_ADDRESS ?? 'no-reply@localhost',
    smtp: {
      host: process.env.SMTP_HOST ?? 'localhost',
      port: toInt(process.env.SMTP_PORT, 1025),
      secure: toBool(process.env.SMTP_SECURE),
      user: process.env.SMTP_USER ?? '',
      password: process.env.SMTP_PASSWORD ?? '',
    },
  },
  send: {
    /** Recipients handled per batch while a campaign is sending. */
    batchSize: toInt(process.env.SEND_BATCH_SIZE, 50),
  },
});
