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

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
