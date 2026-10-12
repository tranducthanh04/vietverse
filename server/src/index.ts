import express from 'express';
import helmet from 'helmet';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { sendError } from './utils/apiResponse.js';

// Native Vercel Express entrypoint; the listener stays in server.ts for Render.
const handler = express();
// The DB guard runs before the shared app, so apply the baseline security headers here too.
handler.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
handler.use('/api', async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    sendError(res, 'Cơ sở dữ liệu chưa sẵn sàng. Vui lòng thử lại.', 503, 'DATABASE_UNAVAILABLE');
  }
});
handler.use(app);

export default handler;
