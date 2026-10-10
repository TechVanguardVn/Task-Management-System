# Task Management System

A production-grade task management system designed with multi-tenancy (workspaces), Role-Based Access Control (RBAC), and interactive Kanban workflows.

**Live Demo & Video:**
- Video Demo: [Watch on Google Drive](https://drive.google.com/drive/folders/14T_9EjsJion-4mOYzElRpcRIDdhdqUiR?usp=sharing)
- Frontend: [https://task-management-system-bay-three.vercel.app](https://task-management-system-bay-three.vercel.app/)
- Backend API: [https://task-management-system-fzbg.onrender.com/api/v1](https://task-management-system-fzbg.onrender.com/api/v1)
- API Docs (Swagger): [https://task-management-system-fzbg.onrender.com/api-docs](https://task-management-system-fzbg.onrender.com/api-docs)

## 1. Technical Stack

**Frontend:**
- Core: React 19, Vite 8, TypeScript 5
- State Management: Redux Toolkit (Auth state), TanStack React Query v5 (Server state)
- UI/UX: Ant Design v6, Tailwind CSS v4, dnd-kit (Kanban DnD)
- Forms & Validation: React Hook Form, Zod

**Backend:**
- Core: Node.js 20, Express 5, TypeScript 5
- Database: MongoDB Atlas, Mongoose 8
- Security: Bcryptjs, JSON Web Token (Access/Refresh strategy), Helmet, Express Rate Limit
- Validation: Zod (Single Source of Truth)
- API Documentation: Swagger JSDoc, Swagger UI Express

**DevOps & Deployment:**
- Containerization: Docker 24.0+, Docker Compose v2.0+
- CI/CD: GitHub Actions

## 2. Architecture Patterns

### 2.1 Backend: Feature-Based Modular Architecture
Adopts a Domain-Driven Design approach where each feature is self-contained.
- **Modules (`src/modules/*`)**: Self-contained domains (auth, tasks, workspaces, dashboard). Each module contains its own routes, controllers, services, models, and schemas.
- **Shared (`src/shared/*`)**: Cross-cutting concerns (middlewares, configurations, utilities, global types).
- **Pipeline**: Route -> Validation Middleware (Zod) -> Auth Middleware -> Controller -> Service -> Mongoose Model.

### 2.2 Frontend: Feature-Sliced Design (FSD)
Organizes code by business domains rather than technical types.
- **Pages (`src/pages/*`)**: Each feature (Auth, Tasks, Workspace, Dashboard) encapsulates its own UI components, hooks, schemas, API calls, and types.
- **Services (`src/services/*`)**: 5-layer API pipeline (Axios Interceptors -> Raw HTTP APIs -> React Query Hooks -> Feature Hooks -> UI Components).
- **Shared (`src/shared/*`)**: Truly global components (ConfirmModal, ErrorBoundary, Layouts).

## 3. Directory Structure

### Backend (`backend/src`)
```text
backend/src/
├── modules/
│   ├── auth/          (Authentication, JWT rotation, session management)
│   ├── dashboard/     (Aggregation queries for analytics)
│   ├── tasks/         (Task CRUD, search, filter, Kanban reorder)
│   └── workspaces/    (Multi-tenancy, RBAC, member management)
├── seeds/             (Database provisioning scripts)
└── shared/
    ├── config/        (Environment validation, DB connection pool)
    ├── middlewares/   (Auth guard, Zod validator, error handler)
    ├── services/      (Cross-domain services)
    ├── swagger/       (OpenAPI 3.0 configuration)
    ├── types/         (Global Express augmentations, API interfaces)
    └── utils/         (Hashing, JWT signer, standard API responses)
```

### Frontend (`frontend/src`)
```text
frontend/src/
├── assets/
├── components/        (Global UI layout, ErrorBoundary, AuthInitializer)
├── config/            (Environment typed wrapper)
├── constants/         (Global constants, QueryKeys)
├── hooks/             (Global hooks e.g., useDebounce)
├── pages/             (Feature-Sliced Domains)
│   ├── Auth/          (Login, Register, Email Verification flows)
│   ├── Dashboard/     (Analytics, stat cards, upcoming tasks)
│   ├── Tasks/         (Task List, Kanban Board, Dispatch mode)
│   ├── Workspace/     (Workspace creation, invitation processing)
│   ├── WorkspaceHub/  (Multi-tenant switching interface)
│   └── WorkspaceMembers/(RBAC management, role assignments)
├── routes/            (React Router configuration, Route Guards)
├── services/          (Network Layer)
│   ├── apis/          (Raw Axios calls)
│   ├── axios/         (Interceptors for token injection/refresh)
│   └── queries/       (React Query definitions)
├── shared/            (Domain-agnostic components)
├── store/             (Redux configuration, Auth slice)
├── types/             (Global TypeScript definitions)
└── utils/             (Date formatting, generic helpers)
```

## 4. Core Features & Business Rules Handled

### 4.1 Authentication & Identity (IAM)
- **Dual Token Strategy**: Short-lived Access Token (15m) and long-lived Refresh Token (7d).
- **Token Rotation**: Refresh tokens are invalidated upon use to prevent reuse attacks.
- **Security Edge Cases**:
  - Concurrent login handling and device limits (max 10 sessions per user via `$slice`).
  - Rate limiting on authentication endpoints to mitigate brute-force attacks.
  - Password complexity enforcement and bcrypt cost-factor 12 hashing.

### 4.2 Multi-Tenancy & RBAC
- **Workspace Isolation**: All task queries enforce a strict `workspaceId` boundary. Users cannot access data outside their authorized workspaces.
- **Roles**: Owner, Admin, Member, Observer.
- **Edge Cases**:
  - Cross-role mutation prevention (Members cannot alter Admin settings).
  - Implicit authorization checks on every resource modification.

### 4.3 Task Management
- **CRUD & Metadata**: Status (TODO, IN_PROGRESS, DONE), Priority (LOW, MEDIUM, HIGH, URGENT).
- **Search & Filter**: Debounced full-text search, multi-condition filtering (status, priority, assignee).
- **Edge Cases**:
  - Prevention of unauthorized task reassignment.
  - Due date evaluations calculated at runtime to prevent stale data.

### 4.4 Kanban Workflow
- **Optimistic UI Updates**: Drag-and-drop operations update the UI immediately before network confirmation, rolling back on failure.
- **Bulk Reordering**: Modifying a task's status or position triggers a single atomic bulk update for all affected tasks.
- **Edge Cases**:
  - `IN_PROGRESS` locks: Tasks actively being worked on restrict unauthorized reassignment.

### 4.5 Dashboard Analytics
- **Real-time Aggregation**: MongoDB `$group` pipelines compute metrics dynamically without fetching raw documents into memory.
- **Metrics**: Overdue counts, upcoming deadlines (next 7 days), completion rates, and priority distribution.

## 5. Feature Implementation Status

### Completed Features (100% MVP)
- **Account Management**: Registration, Login, Logout, Encrypted Passwords, Strict Data Isolation.
- **Task CRUD**: Create, read, update, delete tasks with status and priority tracking.
- **Search & Filter**: Debounced title search, status/priority filters, and pagination.
- **Dashboard**: Task statistics, completion rates, and upcoming deadline tracking.
- **Bonus - Kanban UI**: Drag-and-drop status transitions via `dnd-kit`.
- **Bonus - Docker**: Fully containerized via Docker Compose.
- **Bonus - API Docs**: Swagger OpenAPI integration.
- **Bonus - Cloud Deployment**: Live demo hosted on Vercel and Render.
- **Bonus - Architecture**: FSD Frontend, Modular Backend, Multi-tenancy Workspaces, RBAC.

### Incomplete Features
- **Bonus - Unit / Integration Tests**: Planned for future development phase.

## 6. System Requirements & Execution

**Requirements:** Docker 24.0+, Docker Compose v2.0+

**Execution:**
```bash
docker compose up -d --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/v1`
- Swagger UI: `http://localhost:5000/api-docs`

## 7. Environment Variables
System relies on `.env` (refer to `.env.example`). When executed via Docker Compose, configurations for MongoDB URI, JWT secrets, and ports are automatically provisioned.

## 8. Database Migration & Seeding
Database provisions automatically on startup via `seeds/index.ts`.
Includes:
- 2 Workspaces with pre-configured RBAC.
- 16 Sample tasks covering various statuses and priorities.
- Test Accounts: `user2@gmail.com` (Owner) and `user@example.com` (Member). Password for both is `123456`.

## 9. Deployment Guide
- **Frontend (Vercel)**: Set root to `frontend`. Inject `VITE_API_URL`.
- **Backend (Render)**: Set root to `backend`. Build command: `npm ci --legacy-peer-deps && npm run build`. Start command: `npm run start`. Inject all variables from `.env.example`.
