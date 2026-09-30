# Taskflow - Task Management System

A modern, responsive Task Management System built with **Next.js App Router**, **TypeScript**, **PostgreSQL**, **Drizzle ORM**, **Tailwind CSS**, and **Docker Compose**.

Designed according to the requirements in [`require_task.md`](require_task.md).

> **Demo Video**: [Watch the walkthrough demo video](https://drive.google.com/file/d/1qGYkyF_kALieTyetiM1IT6zUPqZthL4D/view?usp=sharing)

---

## Feature Handover Checklist

### A. Mandatory Requirements (MVP) - 100% Completed

| Feature                            | Requirement Details                                                                                                                                                                                                                                                                                                                                                                  |      Status      |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------: |
| **1. Account Management**          | • User registration (`/signup`)<br>• Secure login & logout (`/login`, User Menu)<br>• Passwords securely hashed with `scrypt` using a random 16-byte salt<br>• Data isolation authorization: Users can only access data they own                                                                                                                                                     | ✅ **Completed** |
| **2. Task Management (Task CRUD)** | • Create tasks (`+ Add task` inline or modal form)<br>• View task details in modal/drawer or list view<br>• Edit tasks: Title, description, status, priority, due date<br>• Permanently delete tasks (`Delete task`)<br>• All 5 fields supported: Title, Description, Status, Priority, Due Date<br>• Exactly 3 statuses: `TODO` (To do), `IN_PROGRESS` (In progress), `DONE` (Done) | ✅ **Completed** |
| **3. Search & Filter**             | • Search by task title and description<br>• Filter by status and priority (`low`, `medium`, `high`, `urgent`)<br>• **Pagination**: Integrated on both the Search page (`/boards/search`) and List View                                                                                                                                                                               | ✅ **Completed** |
| **4. Dashboard**                   | • **Total Tasks** statistics across 4 prominent KPI cards<br>• Task count by status: **To Do**, **In Progress**, **Done**<br>• **Upcoming Tasks** list showing due dates, priority, and direct links to tasks                                                                                                                                                                        | ✅ **Completed** |

### B. Bonus Features - 100% Completed

- [x] **Swagger / OpenAPI Documentation**: Interactive OpenAPI 3.0 API documentation at `/api-docs` with Swagger UI, allowing direct testing ("Try it out") of all REST APIs (Auth, Task CRUD, Search, Filter, Pagination, Dashboard).
- [x] **Kanban Board Interface**: Smooth Drag-and-Drop task cards between status columns (`To Do` ➔ `In Progress` ➔ `Done`) using `@dnd-kit`.
- [x] **Flexible Views**: Toggle between **Kanban Board** and paginated **List View**.
- [x] **Docker Compose**: `docker-compose.yml` to run PostgreSQL locally and `docker-compose.prod.yml` to package and run the entire application (Next.js + Postgres) with a single command.
- [x] **Automated Testing (Unit Tests)**: 11 test suites, 81 automated tests with Vitest (`npm run test`) passing 100%.
- [x] **Database Migration & Seed**: Automated schema creation, foreign keys, and complete sample seed data (`npm run db:migrate`, `npm run db:seed`).

### C. Future Enhancements

- [ ] Real-time push notifications via WebSockets / Server-Sent Events.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 (Taskflow warm theme) + Lucide Icons + GSAP Animations
- **Database**: PostgreSQL 16
- **ORM & Migrations**: [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit
- **Drag & Drop (DnD)**: `@dnd-kit/core` & `@dnd-kit/sortable`
- **Authentication & Security**: Node.js `crypto` (`scrypt`, SHA-256) + HTTP-only Cookie Sessions
- **Validation**: Zod
- **Testing**: Vitest + Playwright
- **Containerization**: Docker & Docker Compose

---

## Installation & Setup Guide

### Prerequisites

- **Node.js**: Version 20.x or higher (or Bun)
- **Docker Desktop**: For running PostgreSQL locally

---

### Method 1: Local Development with Node.js + Docker DB (Recommended)

#### 1. Clone repository & install dependencies:

```bash
npm install
```

#### 2. Configure environment variables:

Create a `.env` file from `.env.example`:

```bash
# Windows PowerShell:
Copy-Item .env.example .env

# Linux / macOS:
cp .env.example .env
```

#### 3. Start PostgreSQL Database:

```bash
docker compose up -d db
```

#### 4. Run Migrations & Seed Sample Data:

```bash
# Run migrations to create tables:
npm run db:migrate

# Seed sample data (demo user, project board, 3 status columns, 4 sample tasks):
npm run db:seed
```

#### 5. Start the Next.js development server:

```bash
npm run dev
```

Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

---

### Demo Account

After running `npm run db:seed`, you can immediately sign in with:

- **Email**: `alice@example.com`
- **Password**: `password123`

_(Or register a new account at `/signup`)._

---

### Method 2: Run with Docker Compose (Production Build)

If you have Docker Desktop installed, you can launch the complete full-stack system (App + Database) with a single command:

```bash
docker compose -f docker-compose.prod.yml up --build
```

The application will be compiled and accessible at: **[http://localhost:3000](http://localhost:3000)**

---

## Code Quality & Verification Commands

The project strictly complies with pre-delivery verification standards:

```bash
# Run ESLint check for syntax and style:
npm run lint

# TypeScript type check:
npm run typecheck

# Run all automated Unit Tests:
npm run test

# Build production bundle:
npm run build
```

---

## API Documentation (Swagger / OpenAPI Documentation)

The system provides comprehensive, interactive API documentation adhering to the **OpenAPI 3.0** standard:

- **Swagger UI Interactive Explorer**: Accessible at `http://localhost:3000/api-docs`
- **OpenAPI 3.0 JSON Specification**: Accessible at `http://localhost:3000/api/openapi.json`

### REST API Endpoints with "Try it out" support:

| Module        | Method   | Endpoint             | Description                                                                          |
| :------------ | :------- | :------------------- | :----------------------------------------------------------------------------------- |
| **Auth**      | `POST`   | `/api/auth/register` | Register a new user account                                                          |
|               | `POST`   | `/api/auth/login`    | Sign in to system (creates HTTP-only session cookie)                                 |
|               | `POST`   | `/api/auth/logout`   | Sign out current user                                                                |
|               | `GET`    | `/api/auth/me`       | Get current authenticated user profile                                               |
| **Tasks**     | `GET`    | `/api/tasks`         | Get task list (supports `q`, `status`, `priority`, `page`, `limit`)                  |
|               | `POST`   | `/api/tasks`         | Create a new task (supports `title`, `description`, `status`, `priority`, `dueDate`) |
|               | `GET`    | `/api/tasks/{id}`    | Get task details by ID                                                               |
|               | `PATCH`  | `/api/tasks/{id}`    | Update task details (title, description, status, priority, due date)                 |
|               | `DELETE` | `/api/tasks/{id}`    | Permanently delete a task                                                            |
| **Dashboard** | `GET`    | `/api/dashboard`     | Overview statistics for 3 task statuses and upcoming tasks                           |
| **System**    | `GET`    | `/api/health`        | Healthcheck probe for Server & Database status                                       |

---

## Project Structure

```text
stackboard-main/
├── app/                        # Next.js App Router (Routes & Server Components)
│   ├── (auth)/                 # Authentication pages (/login, /signup)
│   ├── api/                    # REST API Route Handlers (Auth, Tasks, Dashboard)
│   ├── api-docs/               # Interactive Swagger UI (/api-docs)
│   ├── boards/                 # Dashboard overview (/boards)
│   │   ├── [boardId]/          # Kanban board & List view for a project
│   │   │   ├── cards/[cardId]/ # Task detail modal & edit / delete modal
│   │   │   ├── board-board.tsx # Drag-and-drop Kanban board component
│   │   │   └── board-list.tsx  # Paginated list view component
│   │   └── search/             # Paginated search & filter page
│   └── globals.css             # Color tokens & theme styling
├── db/                         # Database schema & Migrations
│   ├── schema.ts               # Database table schemas (users, boards, columns, cards, sessions)
│   ├── migrations/             # SQL migrations auto-generated by Drizzle
│   └── seed.ts                 # Initial demo seed script
├── lib/
│   ├── actions/                # Next.js Server Actions (task CRUD, auth handlers)
│   ├── auth/                   # Session management & password hashing
│   ├── domain/                 # Pure business logic with unit tests (tasks, due, health...)
│   ├── openapi.ts              # OpenAPI 3.0 specification definition
│   └── queries/                # Server-only database read queries
├── docker-compose.yml          # Docker Compose for local PostgreSQL dev
├── docker-compose.prod.yml     # Docker Compose full-stack production build
├── .env.example                # Sample environment configuration file
└── require_task.md             # Task requirements and evaluation criteria
```

---

## License & Author

This project was built for an Intern / Junior Fullstack Developer assessment.
For any questions or feedback, please open a Pull Request or contact Nguyen Thi Hong Diep (HongDiep18).
