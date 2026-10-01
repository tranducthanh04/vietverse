import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Vietverse Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`👉 API Health check: http://localhost:${env.PORT}/health`);
      logger.info(`👉 API Root: http://localhost:${env.PORT}/api/v1`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
