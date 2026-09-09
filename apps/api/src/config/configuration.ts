const toBool = (value: string | undefined, fallback = false) =>
  value === undefined ? fallback : ['1', 'true', 'yes'].includes(value.toLowerCase());

const toInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: toInt(process.env.API_PORT, 4000),
    prefix: process.env.API_PREFIX ?? 'api',
    corsOrigins: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
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
