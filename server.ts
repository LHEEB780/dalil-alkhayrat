import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes/api.ts';
import { adminRouter } from './server/routes/adminRoutes.ts';
import { adminCatalogRouter } from './server/routes/adminCatalogRoutes.ts';
import {
  adminOrdersRouter,
  adminDisputesRouter,
  adminLogisticsRouter
} from './server/routes/adminOrdersRoutes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // Mount Admin Operations & API routes (specific routers MUST precede generic /api/admin)
  app.use('/api/admin/catalog', adminCatalogRouter);
  app.use('/api/admin/orders', adminOrdersRouter);
  app.use('/api/admin/disputes', adminDisputesRouter);
  app.use('/api/admin/logistics', adminLogisticsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', apiRouter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Souq Al-Jumla B2B Engine', time: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Initialize Vite middleware asynchronously so port 3000 binds immediately for health checks
    const vitePromise = import('vite').then(({ createServer }) =>
      createServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      })
    );

    vitePromise.catch((err) => {
      console.error('Failed to initialize Vite dev middleware:', err);
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        return vite.middlewares(req, res, next);
      } catch (err) {
        return next(err);
      }
    });
  } else {
    // Production mode: Serve pre-built static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Souq Al-Jumla] Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
