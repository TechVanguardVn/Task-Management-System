import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { taskRouter } from './modules/tasks/task.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

const openapiDoc = YAML.parse(fs.readFileSync(path.join(__dirname, 'docs', 'openapi.yaml'), 'utf8'));

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false })); // CSP tắt để Swagger UI hoạt động
  app.use(cors({ origin: env.corsOrigins, credentials: false }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/docs/openapi.json', (_req, res) => {
    res.json(openapiDoc);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc, { customSiteTitle: 'Taskflow API' }));

  app.use('/api/auth', authRouter);
  app.use('/api/tasks', taskRouter);
  app.use('/api/dashboard', dashboardRouter);

  serveFrontend(app);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

/**
 * Deploy 1 dịch vụ (vd. Render): nếu có bản build của frontend thì API phục vụ luôn
 * giao diện trên cùng domain. Docker Compose / dev không có thư mục này nên bỏ qua.
 */
function serveFrontend(app: express.Express) {
  const dist = env.FRONTEND_DIST ?? path.resolve(__dirname, '..', '..', 'frontend', 'dist');
  const indexHtml = path.join(dist, 'index.html');
  if (env.isTest || !fs.existsSync(indexHtml)) return;

  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  // SPA fallback cho React Router (mọi GET không phải /api)
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(indexHtml);
  });
}
