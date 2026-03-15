import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  PORT: parseInt(process.env['PORT'] ?? '3001', 10),
  DATABASE_URL: process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/ai_teacher_evaluator',
  ANTHROPIC_API_KEY: process.env['ANTHROPIC_API_KEY'] ?? '',
  NCERT_BASE_PATH: process.env['NCERT_BASE_PATH'] ?? '/Users/madhavavarma/ClaudeCode/NCERT',
  JWT_SECRET: process.env['JWT_SECRET'] ?? 'dev_secret_change_in_prod',
  ADMIN_ALLOWED_IPS: (process.env['ADMIN_ALLOWED_IPS'] ?? '127.0.0.1,::1').split(','),
  isProduction: process.env['NODE_ENV'] === 'production',
  isDevelopment: process.env['NODE_ENV'] === 'development',
};
