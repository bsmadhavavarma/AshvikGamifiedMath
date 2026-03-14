import pino from 'pino';

const nodeEnv = process.env['NODE_ENV'];
const logLevel = process.env['LOG_LEVEL'] ?? (nodeEnv === 'production' ? 'info' : 'debug');
const isDevelopment = nodeEnv === 'development';

export const logger = pino({
  level: nodeEnv === 'test' ? 'silent' : logLevel,
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  base: {
    pid: process.pid,
    service: 'ashvik-gamified-math',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
