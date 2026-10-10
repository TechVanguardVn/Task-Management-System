import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoSanitize from 'express-mongo-sanitize'
import swaggerUi from 'swagger-ui-express'
import { env } from '@shared/config/env.config'
import { errorHandler } from '@shared/middlewares/error.middleware'
import { swaggerSpec } from '@shared/swagger/swagger.config'
import authRouter from '@modules/auth/auth.route'
import taskRouter from '@modules/tasks/task.route'
import dashboardRouter from '@modules/dashboard/dashboard.route'
import workspaceRouter from '@modules/workspaces/workspace.route'

const app: Application = express()

app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/tasks', taskRouter)
app.use('/api/v1/dashboard', dashboardRouter)
app.use('/api/v1/workspaces', workspaceRouter)

app.use(errorHandler)

export { app }
