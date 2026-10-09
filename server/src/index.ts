import express from 'express';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { sendError } from './utils/apiResponse.js';

// Native Vercel Express entrypoint; the listener stays in server.ts for Render.
const handler = express();
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
