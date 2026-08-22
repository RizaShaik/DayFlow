import 'dotenv/config';

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  db: {
    host: required('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT) || 5432,
    name: required('DB_NAME', 'dayflow'),
    user: required('DB_USER', 'dayflow'),
    password: required('DB_PASSWORD', 'dayflow'),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'Dayflow HRMS <no-reply@dayflow.local>',
  },

  uploads: {
    maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 5,
  },
};

export const isProduction = env.nodeEnv === 'production';
