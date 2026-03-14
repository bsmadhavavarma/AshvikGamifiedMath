import cors, { CorsOptions } from 'cors';
import { env } from '../config/env';

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (origin === undefined || origin === null) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy does not allow origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining'],
  credentials: true,
  maxAge: 86400, // 24 hours preflight cache
};

export const corsMiddleware = cors(corsOptions);
