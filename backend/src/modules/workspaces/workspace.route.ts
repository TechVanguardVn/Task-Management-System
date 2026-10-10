import { Router } from 'express'
import * as workspaceController from './workspace.controller'
import { authenticate } from '@shared/middlewares/auth.middleware'
import { validate } from '@shared/middlewares/validate.middleware'
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  getWorkspacesQuerySchema,
  addWorkspaceMemberSchema
} from './workspace.schema'

/**
 * @swagger
 * tags:
 *   name: Workspaces
 *   description: Workspace and RBAC Management
 */

const router = Router()

router.use(authenticate)

/**
 * @swagger
 * /workspaces:
 *   get:
 *     summary: Get all workspaces for current user
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workspaces
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
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Workspace'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', validate(getWorkspacesQuerySchema), workspaceController.getWorkspaces)

/**
 * @swagger
 * /workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkspaceInput'
 *     responses:
 *       201:
 *         description: Workspace created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Workspace'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', validate(createWorkspaceSchema), workspaceController.createWorkspace)
/**
 * @swagger
 * /workspaces/{id}:
 *   get:
 *     summary: Get workspace by ID
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workspace details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Workspace'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', workspaceController.getWorkspaceById)

/**
 * @swagger
 * /workspaces/{id}/members:
 *   get:
 *     summary: Get all members of a workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of members
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
 *                           user: { $ref: '#/components/schemas/User' }
 *                           role: { type: 'string', example: 'MEMBER' }
 *                           joinedAt: { type: 'string', format: 'date-time' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id/members', workspaceController.getWorkspaceMembers)

/**
 * @swagger
 * /workspaces/{id}/members:
 *   post:
 *     summary: Invite a new member to workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email: { type: 'string', format: 'email', example: 'newuser@example.com' }
 *               role: { type: 'string', enum: ['ADMIN', 'MEMBER', 'OBSERVER'], example: 'MEMBER' }
 *     responses:
 *       200:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/members', validate(addWorkspaceMemberSchema), workspaceController.addWorkspaceMember)
/**
 * @swagger
 * /workspaces/{id}/members/{memberId}/role:
 *   patch:
 *     summary: Update a member's role
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: 'string', enum: ['ADMIN', 'MEMBER', 'OBSERVER'], example: 'ADMIN' }
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden (Only OWNER/ADMIN can change roles)
 */
router.patch('/:id/members/:memberId/role', workspaceController.updateWorkspaceMemberRole)

/**
 * @swagger
 * /workspaces/{id}/members/{memberId}:
 *   delete:
 *     summary: Remove a member from workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden
 */
router.delete('/:id/members/:memberId', workspaceController.removeWorkspaceMember)

/**
 * @swagger
 * /workspaces/{id}:
 *   patch:
 *     summary: Update workspace details
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: 'string', example: 'New Name' }
 *               description: { type: 'string', example: 'New description' }
 *     responses:
 *       200:
 *         description: Workspace updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Workspace'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden
 */
router.patch('/:id', validate(updateWorkspaceSchema), workspaceController.updateWorkspace)

/**
 * @swagger
 * /workspaces/{id}:
 *   delete:
 *     summary: Delete a workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workspace deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden (Only OWNER can delete)
 */
router.delete('/:id', workspaceController.deleteWorkspace)

export default router
