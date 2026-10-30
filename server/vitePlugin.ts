import { type Plugin } from 'vite';
import express from 'express';
import { apiRouter } from './router.ts';

/**
 * Vite plugin that mounts the AccessAI backend API router directly inside the Vite development server.
 */
export function scanEnginePlugin(): Plugin {
  const app = express();
  app.use(apiRouter);

  return {
    name: 'accessai-scan-engine',
    configureServer(server) {
      server.middlewares.use('/api', (req: any, res: any, next: any) => {
        app(req, res, next);
      });
      console.log('✅ AccessAI Real Scanning Engine API mounted at /api/*');
    }
  };
}
