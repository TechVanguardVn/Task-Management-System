import { Router } from 'express'
import * as dashboardController from '@modules/dashboard/dashboard.controller'
import { authenticate } from '@shared/middlewares/auth.middleware'

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard Analytics and Statistics
 */

const router = Router()

router.use(authenticate)

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard core statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalWorkspaces: { type: 'number', example: 5 }
 *                         totalTasks: { type: 'number', example: 120 }
 *                         completedTasks: { type: 'number', example: 45 }
 *                         upcomingDeadlines: { type: 'number', example: 12 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', dashboardController.getStats)

/**
 * @swagger
 * /dashboard/upcoming:
 *   get:
 *     summary: Get upcoming tasks (due within 7 days)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of upcoming tasks
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/upcoming', dashboardController.getUpcomingTasks)

/**
 * @swagger
 * /dashboard/workload:
 *   get:
 *     summary: Get team resource workload
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team workload statistics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId: { type: 'string', example: '6ac7fbdff3bb125fbeaefa9d' }
 *                           fullName: { type: 'string', example: 'John Doe' }
 *                           taskCount: { type: 'number', example: 5 }
 *                           capacity: { type: 'number', example: 100 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/workload', dashboardController.getWorkload)

export default router
