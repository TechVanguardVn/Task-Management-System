import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as authController from '@modules/auth/auth.controller'
import { authenticate } from '@shared/middlewares/auth.middleware'
import { validate } from '@shared/middlewares/validate.middleware'
import { registerSchema, loginSchema, refreshTokenSchema, logoutSchema, verifyEmailSchema, resendOtpSchema, googleOAuthSchema } from '@modules/auth/auth.schema'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many requests, please try again after 15 minutes', statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and Identity Management
 */

const router = Router()

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               email: { type: 'string', format: 'email', example: 'newuser@example.com' }
 *               password: { type: 'string', minLength: 8, example: 'securePassword123' }
 *               fullName: { type: 'string', example: 'New User' }
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     message: { type: 'string', example: 'User registered successfully' }
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
 *                         refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
 *                         user: { $ref: '#/components/schemas/User' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/register', authLimiter, validate(registerSchema), authController.register)
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: 'string', format: 'email', example: 'user2@gmail.com' }
 *               password: { type: 'string', example: '123456' }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     message: { type: 'string', example: 'Login successful' }
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
 *                         refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
 *                         user: { $ref: '#/components/schemas/User' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login)
/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email using OTP
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: 'string', format: 'email', example: 'newuser@example.com' }
 *               code: { type: 'string', example: '123456' }
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail)

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP code to email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: 'string', format: 'email', example: 'newuser@example.com' }
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/resend-otp', validate(resendOtpSchema), authController.resendOtp)

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Login or register with Google OAuth
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credential]
 *             properties:
 *               credential: { type: 'string' }
 *     responses:
 *       200:
 *         description: Login/Register successful
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/google', validate(googleOAuthSchema), authController.googleOAuth)
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: 'string', example: 'your.refresh.token.here' }
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     message: { type: 'string', example: 'Token refreshed successfully' }
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken)
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: 'string', example: 'your.refresh.token.here' }
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', authenticate, validate(logoutSchema), authController.logout)
/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout all sessions across all devices
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions logged out successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout-all', authenticate, authController.logoutAll)
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', authenticate, authController.me)

export default router
