export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Taskflow - Task Management System API',
        version: '1.0.0',
        description:
            'REST API specification for the Task Management System (Intern / Fullstack Developer Project). Provides endpoints for Authentication, Task CRUD, Search, Filter, Pagination, and Dashboard analytics.',
        contact: {
            name: 'Taskflow Developer Team',
        },
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Local development server',
        },
    ],
    tags: [
        { name: 'Auth', description: 'User registration, login, logout, and profile' },
        { name: 'Tasks', description: 'Task CRUD operations, search, filter, and pagination' },
        { name: 'Dashboard', description: 'Task metrics, status breakdown, and upcoming deadlines' },
        { name: 'System', description: 'Health check probe' },
    ],
    paths: {
        '/api/health': {
            get: {
                tags: ['System'],
                summary: 'Check API and Database health',
                description: 'Returns the health status of the application and the PostgreSQL connection.',
                responses: {
                    '200': {
                        description: 'System healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'ok' },
                                        checks: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    name: { type: 'string', example: 'database' },
                                                    status: { type: 'string', example: 'up' },
                                                    durationMs: { type: 'number', example: 4 },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new user account',
                description: 'Creates a new user with an email, full name, and securely hashed password using scrypt.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password', 'name'],
                                properties: {
                                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                                    password: { type: 'string', format: 'password', minLength: 8, example: 'password123' },
                                    name: { type: 'string', example: 'John Doe' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'User registered successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string', example: 'User registered successfully' },
                                        user: { $ref: '#/components/schemas/User' },
                                    },
                                },
                            },
                        },
                    },
                    '400': { description: 'Validation error or email already in use' },
                },
            },
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'User login',
                description: 'Authenticates with email and password, establishing an HTTP-only session cookie.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', format: 'email', example: 'alice@example.com' },
                                    password: { type: 'string', format: 'password', example: 'password123' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Login successful (sets deck_session cookie)',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string', example: 'Login successful' },
                                        user: { $ref: '#/components/schemas/User' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { description: 'Invalid email or password' },
                },
            },
        },
        '/api/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'User logout',
                description: 'Terminates the current session and clears the session cookie.',
                responses: {
                    '200': {
                        description: 'Logged out successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string', example: 'Logged out successfully' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Get current user profile',
                description: 'Returns the profile of the currently authenticated user.',
                responses: {
                    '200': {
                        description: 'Current user profile',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' },
                            },
                        },
                    },
                    '401': { description: 'Not authenticated' },
                },
            },
        },
        '/api/tasks': {
            get: {
                tags: ['Tasks'],
                summary: 'List tasks with search, filter, and pagination',
                description: 'Retrieves user tasks. Supports searching by title (?q=), filtering by status (?status=TODO) and priority (?priority=medium), and pagination (?page=1&limit=10).',
                parameters: [
                    { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search term matching task title or description' },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'] }, description: 'Filter by status' },
                    { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] }, description: 'Filter by priority' },
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 }, description: 'Page number' },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, minimum: 1, maximum: 50 }, description: 'Items per page' },
                ],
                responses: {
                    '200': {
                        description: 'Paginated list of tasks',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Task' },
                                        },
                                        pagination: {
                                            type: 'object',
                                            properties: {
                                                page: { type: 'integer', example: 1 },
                                                limit: { type: 'integer', example: 10 },
                                                totalItems: { type: 'integer', example: 4 },
                                                totalPages: { type: 'integer', example: 1 },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '401': { description: 'Not authenticated' },
                },
            },
            post: {
                tags: ['Tasks'],
                summary: 'Create a new task',
                description: 'Creates a new task with title, description, status (TODO, IN_PROGRESS, DONE), priority, and due date.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['title'],
                                properties: {
                                    title: { type: 'string', example: 'Implement Swagger UI' },
                                    description: { type: 'string', example: 'Setup OpenAPI spec and Swagger UI page' },
                                    status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
                                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
                                    dueDate: { type: 'string', format: 'date-time', example: '2026-10-05T00:00:00.000Z' },
                                    boardId: { type: 'string', format: 'uuid', description: 'Optional board ID. If omitted, uses default active board.' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Task created successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Task' },
                            },
                        },
                    },
                    '400': { description: 'Validation error' },
                    '401': { description: 'Not authenticated' },
                },
            },
        },
        '/api/tasks/{id}': {
            get: {
                tags: ['Tasks'],
                summary: 'Get task detail by ID',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Task ID' },
                ],
                responses: {
                    '200': {
                        description: 'Task details',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Task' },
                            },
                        },
                    },
                    '404': { description: 'Task not found' },
                    '401': { description: 'Not authenticated' },
                },
            },
            patch: {
                tags: ['Tasks'],
                summary: 'Update task by ID',
                description: 'Update any fields of a task (title, description, status, priority, dueDate).',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Task ID' },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string', example: 'Updated title' },
                                    description: { type: 'string', example: 'Updated description' },
                                    status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'] },
                                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                                    dueDate: { type: 'string', format: 'date-time', nullable: true },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Task updated successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Task' },
                            },
                        },
                    },
                    '404': { description: 'Task not found' },
                    '401': { description: 'Not authenticated' },
                },
            },
            delete: {
                tags: ['Tasks'],
                summary: 'Delete task by ID',
                description: 'Permanently deletes a task.',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Task ID' },
                ],
                responses: {
                    '200': {
                        description: 'Task deleted successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string', example: 'Task deleted successfully' },
                                        id: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    '404': { description: 'Task not found' },
                    '401': { description: 'Not authenticated' },
                },
            },
        },
        '/api/dashboard': {
            get: {
                tags: ['Dashboard'],
                summary: 'Get dashboard statistics',
                description: 'Returns total tasks count, breakdown by status (TODO, IN_PROGRESS, DONE), and list of upcoming due tasks.',
                responses: {
                    '200': {
                        description: 'Dashboard metrics',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/DashboardStats' },
                            },
                        },
                    },
                    '401': { description: 'Not authenticated' },
                },
            },
        },
    },
    components: {
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
                    name: { type: 'string', example: 'Alice Owens' },
                    email: { type: 'string', format: 'email', example: 'alice@example.com' },
                },
            },
            Task: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    boardId: { type: 'string', format: 'uuid' },
                    columnId: { type: 'string', format: 'uuid' },
                    title: { type: 'string', example: 'Product Redesign' },
                    description: { type: 'string', example: 'Redesign core user experience' },
                    status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'], example: 'TODO' },
                    statusName: { type: 'string', example: 'To do' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'medium' },
                    dueDate: { type: 'string', format: 'date-time', nullable: true },
                    position: { type: 'integer', example: 0 },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            DashboardStats: {
                type: 'object',
                properties: {
                    totalTasks: { type: 'integer', example: 4 },
                    toDoCount: { type: 'integer', example: 1 },
                    inProgressCount: { type: 'integer', example: 2 },
                    doneCount: { type: 'integer', example: 1 },
                    upcomingTasks: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                title: { type: 'string', example: 'Mobile App Beta' },
                                priority: { type: 'string', example: 'medium' },
                                dueDate: { type: 'string', format: 'date-time' },
                                boardName: { type: 'string', example: 'Website Redesign' },
                                columnName: { type: 'string', example: 'In progress' },
                            },
                        },
                    },
                },
            },
        },
    },
}
