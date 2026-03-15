import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.isDevelopment ? 'debug' : 'info',
  transport: env.isDevelopment
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
    : undefined,
});
