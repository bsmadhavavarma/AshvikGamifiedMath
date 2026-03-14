// Set test environment variables before any module imports
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/testdb';
process.env['PORT'] = '3001';
process.env['CORS_ORIGIN'] = 'http://localhost:3000';
process.env['JWT_SECRET'] = 'test-jwt-secret-that-is-at-least-32-chars-long';

// Suppress pino logs during tests (set LOG_LEVEL to silent)
process.env['LOG_LEVEL'] = 'silent';
