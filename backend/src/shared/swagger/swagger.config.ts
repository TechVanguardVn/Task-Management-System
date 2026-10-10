import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management System API',
      version: '1.0.0',
      description: 'RESTful API documentation for Task Management System',
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            email: { type: 'string', format: 'email', example: 'user2@gmail.com' },
            fullName: { type: 'string', example: 'Test User 2' },
          },
        },
        Workspace: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109cb' },
            name: { type: 'string', example: 'Engineering Team' },
            description: { type: 'string', example: 'Core engineering workspace' },
            ownerId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateWorkspaceInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Engineering Team' },
            description: { type: 'string', example: 'Core engineering workspace' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109cc' },
            title: { type: 'string', example: 'Implement login page' },
            description: { type: 'string', example: 'Use React Hook Form and Zod' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'], example: 'TODO' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
            dueDate: { type: 'string', format: 'date-time', example: '2026-10-25T10:00:00Z' },
            order: { type: 'number', example: 1000 },
            tags: { type: 'array', items: { type: 'string' }, example: ['frontend', 'auth'] },
            workspaceId: { type: 'string', example: '60d0fe4f5311236168a109cb' },
            creatorId: { type: 'string' },
            assigneeId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTaskInput: {
          type: 'object',
          required: ['title', 'workspaceId'],
          properties: {
            title: { type: 'string', example: 'Implement login page' },
            description: { type: 'string', example: 'Use React Hook Form and Zod' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'], example: 'TODO' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'MEDIUM' },
            dueDate: { type: 'string', format: 'date-time', example: '2026-10-25T10:00:00Z' },
            tags: { type: 'array', items: { type: 'string' }, example: ['frontend', 'auth'] },
            workspaceId: { type: 'string', example: '60d0fe4f5311236168a109cb' },
            assigneeId: { type: 'string', nullable: true, example: null },
          },
        },
        UpdateTaskInput: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Implement login page' },
            description: { type: 'string', example: 'Use React Hook Form and Zod' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
            dueDate: { type: 'string', format: 'date-time', example: '2026-10-25T10:00:00Z' },
            tags: { type: 'array', items: { type: 'string' }, example: ['frontend', 'auth'] },
            assigneeId: { type: 'string', nullable: true, example: null },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiError'
              },
              example: {
                success: false,
                error: 'Authentication failed. Please login again.',
                statusCode: 401
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiError'
              },
              example: {
                success: false,
                error: 'Validation Error: Invalid email format',
                statusCode: 400
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiError'
              },
              example: {
                success: false,
                error: 'Resource not found',
                statusCode: 404
              }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.route.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)
