import pino from 'pino';

const nodeEnv = process.env['NODE_ENV'];
const logLevel = process.env['LOG_LEVEL'] ?? (nodeEnv === 'production' ? 'info' : 'debug');

export const logger = pino({
  level: nodeEnv === 'test' ? 'silent' : logLevel,
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
