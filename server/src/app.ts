import express, { Request, Response } from 'express';
import * as helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';
import { sendSuccess, sendError } from './utils/apiResponse.js';

// Route imports
import authRouter from './modules/auth/auth.routes.js';
import childrenRouter from './modules/children/children.routes.js';
import stagesRouter from './modules/stages/stages.routes.js';
import lessonsRouter from './modules/lessons/lessons.routes.js';
import recordingsRouter from './modules/recordings/recordings.routes.js';
import storiesRouter from './modules/stories/stories.routes.js';
import cultureRouter from './modules/culture/culture.routes.js';
import pointsRouter from './modules/points/points.routes.js';
import parentRouter from './modules/parent/parent.routes.js';
import adminRouter from './modules/admin/admin.routes.js';

export const app = express();

// Security and utility middlewares
app.use(
  helmet.default ? helmet.default({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }) : (helmet as any)({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = [
  env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://vietverse.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/proxy setup
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
    })
  );
}

// Health check endpoint for Render / monitoring
app.get('/health', (_req: Request, res: Response) => {
  return sendSuccess(res, {
    status: 'ok',
    environment: env.NODE_ENV,
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Apply API rate limiter to all API v1 endpoints
app.use('/api/v1', apiLimiter);

// API v1 Routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/children', childrenRouter);
app.use('/api/v1/stages', stagesRouter);
app.use('/api/v1/lessons', lessonsRouter);
app.use('/api/v1/recordings', recordingsRouter);
app.use('/api/v1/stories', storiesRouter);
app.use('/api/v1/culture', cultureRouter);
app.use('/api/v1/points', pointsRouter);
app.use('/api/v1/parent', parentRouter);
app.use('/api/v1/admin', adminRouter);

// 404 Handler in Vietnamese
app.use((req: Request, res: Response) => {
  sendError(res, `Đường dẫn '${req.originalUrl}' không tồn tại trên hệ thống Vietverse`, 404, 'NOT_FOUND');
});

// Centralized error handler
app.use(errorHandler);
