import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { apiRouter } from './router.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

// Root health-check endpoint for Render and external load balancers
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    engine: 'AccessAI Production Server',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRouter);

// Serve public static assets (including standalone accessibility-widget.js)
const publicPath = path.resolve('public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Serve production built frontend from dist
const distPath = path.resolve('dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// SPA fallback for frontend client routing
app.get('*', (req, res) => {
  // If requesting an API or widget route that wasn't matched, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.status(200).send(`
    <html>
      <head><title>AccessAI API Server</title></head>
      <body style="font-family: system-ui, sans-serif; padding: 40px; text-align: center;">
        <h2>AccessAI Production API Server is Running</h2>
        <p>Frontend dist directory not found. Run <code>npm run build</code> to compile the client application.</p>
        <p><a href="/health">Health Check</a> • <a href="/accessibility-widget.js">Accessibility Widget</a></p>
      </body>
    </html>
  `);
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 AccessAI Production Server listening on http://${HOST}:${PORT}`);
});
