import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Configurações do banco de dados
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().optional(), // Para Supabase migrations

  // Supabase Configuration
  SUPABASE_URL: Joi.string().uri().optional(),
  SUPABASE_ANON_KEY: Joi.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional(),

  // Segurança JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Criptografia
  ENCRYPTION_KEY: Joi.string().length(64).required(), // 256 bits em hex
  ENCRYPTION_IV: Joi.string().length(32).required(),  // 128 bits em hex

  // Redis
  REDIS_URL: Joi.string().required(),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().email().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM: Joi.string().required(),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: Joi.string().required(),
  TWILIO_AUTH_TOKEN: Joi.string().required(),
  TWILIO_FROM_NUMBER: Joi.string().required(),

  // Aplicação
  APP_NAME: Joi.string().default('TimeMedic'),
  APP_URL: Joi.string().uri().required(),
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // CORS
  CORS_ORIGIN: Joi.string().required(),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60000),
  RATE_LIMIT_LIMIT: Joi.number().default(100),

  // Localização
  TIMEZONE: Joi.string().default('America/Sao_Paulo'),
  LOCALE: Joi.string().default('pt-BR'),
  CURRENCY: Joi.string().default('BRL'),

  // ANVISA
  ANVISA_API_URL: Joi.string().uri().required(),
  ANVISA_API_KEY: Joi.string().required(),

  // VigiMed
  VIGIMOD_API_URL: Joi.string().uri().required(),
  VIGIMOD_API_KEY: Joi.string().required(),

  // Logs
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE_ENABLED: Joi.boolean().default(true),
  LOG_FILE_PATH: Joi.string().default('./logs/timemedic.log'),

  // Backup
  BACKUP_ENABLED: Joi.boolean().default(true),
  BACKUP_INTERVAL: Joi.string().valid('hourly', 'daily', 'weekly').default('daily'),
  BACKUP_RETENTION_DAYS: Joi.number().default(30),

  // LGPD
  DATA_RETENTION_YEARS: Joi.number().default(5),
  ANONYMIZATION_ENABLED: Joi.boolean().default(true),
  AUDIT_LOG_RETENTION_YEARS: Joi.number().default(7),

  // Monitoramento
  HEALTH_CHECK_ENABLED: Joi.boolean().default(true),
  METRICS_ENABLED: Joi.boolean().default(true),

  // PWA Push Notifications
  VAPID_PUBLIC_KEY: Joi.string().required(),
  VAPID_PRIVATE_KEY: Joi.string().required(),
  VAPID_SUBJECT: Joi.string().email().required(),

  // Database connection optimization
  DB_CONNECTION_LIMIT: Joi.number().default(20),
  DB_POOL_TIMEOUT: Joi.number().default(10000),
  DB_STATEMENT_TIMEOUT: Joi.number().default(30000),
});