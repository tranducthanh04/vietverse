// Compatibility import for the shared HTTP app. Do not import Express here:
// Vercel probes app.ts before index.ts; only index.ts owns the native handler.
export { app } from './httpApp.js';
