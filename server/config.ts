import path from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';

function resolveFromCwd(filePath: string) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

function parseBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true' || value === '1' || value.toLowerCase() === 'yes';
}

function parseCsv(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const config = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 3001),
  databaseFile: resolveFromCwd(process.env.DATABASE_FILE ?? './storage/orders.db'),
  adminPassword: process.env.ADMIN_PASSWORD ?? (isProduction ? '' : 'admin123456'),
  jwtSecret: process.env.JWT_SECRET ?? (isProduction ? '' : 'development-only-secret'),
  notifyEmailTo: process.env.NOTIFY_EMAIL_TO ?? '',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: parseBoolean(process.env.SMTP_SECURE, false),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  smtpFrom: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'Essential Goods <orders@example.com>',
  adminPath: process.env.VITE_ADMIN_PATH ?? '/admin',
  allowedOrigins: parseCsv(process.env.ALLOWED_ORIGINS),
  nodeEnv: process.env.NODE_ENV ?? 'development',
};

export function validateRuntimeConfig() {
  const missing: string[] = [];

  if (!config.adminPassword) {
    missing.push('ADMIN_PASSWORD');
  }

  if (!config.jwtSecret) {
    missing.push('JWT_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
