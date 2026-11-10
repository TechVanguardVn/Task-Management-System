# Task Management System

Backend / full-stack developer internship assignment · Estimated time: 2–3 days

**[Live demo on Vercel](https://task-management-system-ten-black.vercel.app)** · [Watch the demo on YouTube](https://youtu.be/Zy0XcifNIL4) · [Swagger UI](https://task-management-system-ten-black.vercel.app/api/docs/)

**Demo account**

| Email            | Password    |
| ---------------- | ----------- |
| `user@gmail.com` | `123456789` |

The assignment brief and submission checklist are in sections 1–5. To run this implementation, start with [Local setup](#6-local-setup). To review it, see the [feature checklist](#7-implemented-features), [backend tests](#9-backend-tests), and [Swagger UI walkthrough](#10-try-the-api-in-swagger-ui).

## Submission process

1. Fork the repository and complete the assignment in your fork.
2. Open a pull request against the original repository.
3. Submit the pull request link and a short description of your work.

![Kanban dashboard design reference by Creliq UX/UI Design Agency on Dribbble](images/demo.jpeg)

## 1. Project objective

Build a task management application for an individual or a small team. Users should be able to create tasks, update them, and track progress. Choose a stack suited to the role and deliver the source code, database, setup instructions, and API details if the project includes a backend.

## 2. Functional requirements

| MVP requirement      | Expected behavior                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts             | Users can register, sign in, and sign out. Store passwords securely and restrict each user to their own data.                                                                 |
| Task management      | Users can create, view, edit, and delete tasks. Each task has a title, description, status, priority, and due date. Supported statuses are `TODO`, `IN_PROGRESS`, and `DONE`. |
| Search and filtering | Search by title, filter by status and priority, and paginate large result sets.                                                                                               |
| Dashboard            | Show the total task count, counts for each status, and a list of upcoming deadlines.                                                                                          |

**Optional features** include a Kanban board with drag and drop, Docker Compose, unit or integration tests, Swagger/OpenAPI documentation, a CI pipeline that runs tests on push, and a publicly hosted demo.

## 3. Technology choices

Candidates may choose their own stack. Suggested options include Node.js and PHP with Laravel.

## 4. Database requirements

Design a schema that supports the application. Include migrations that create the tables, foreign keys, and data constraints.

## 5. Submission checklist

- A pull request against the original repository
- A README with installation and startup instructions
- An `.env.example` file with placeholders for secrets
- Database migrations and seed data
- API documentation or a user guide
- A list of completed and outstanding features
- A 3–5 minute demo video or a live demonstration

---

## 6. Local setup

The frontend uses React and Vite. The Express backend connects to PostgreSQL through Prisma. The commands below use PowerShell.

### Prerequisites

Install Git, Node.js 22.18, and npm. Create an empty PostgreSQL database locally or on Supabase. The database user needs permission to create tables, types, functions, and triggers.

```powershell
git clone https://github.com/hngkhang/Task-Management-System.git
cd Task-Management-System
```

### Configure the backend

In the first terminal, install dependencies and copy the environment template.

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Set `DATABASE_URL` in `backend/.env`. For a local database named `task_management`, replace these placeholders with your PostgreSQL credentials.

```dotenv
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/task_management"
```

For Supabase, use the **Session pooler** connection string on port `5432`, following the [environment template](backend/.env.example). URL-encode special characters in the password. Keep the API on port `3000` to match the Vite proxy.

`npm ci` generates the Prisma Client. From `backend`, apply the migrations to your configured database.

```powershell
npx prisma migrate deploy --config prisma7.config.ts
```

### Load sample data (optional)

Run the seed command against a disposable development database. The seed script can recreate projects owned by its sample accounts.

```powershell
npx prisma db seed --config prisma7.config.ts
```

To view seeded tasks, open `/login` after starting the app. With the two-account seed, use the credentials defined by `SECOND_USER_EMAIL` and `SECOND_USER_PASSWORD`, then open **Projects → FinTech Personal Expense Tracker**. A newly registered account starts with an empty dashboard because projects belong to their owners. [Seed script](backend/prisma/seed.ts)

### Start the application

In the first terminal, start the API from `backend`.

```powershell
npm run dev
```

The [health endpoint](http://localhost:3000/api/v1/health) returns `{"status":"ok","database":"connected"}` when the API can reach PostgreSQL.

In a second terminal, start the frontend from the root of the repository.

```powershell
cd frontend
npm ci
npm run dev
```

Keep both terminals running. Open the [local app](http://localhost:5173) or use the local URL printed by Vite if port `5173` is occupied.

### Create your first task

1. Open `/register` and enter your name, email, and a password between 8 and 128 characters.
2. Open **Projects**, select **New Project**, enter a name, and save. Open the project.
3. Select **New Task**, enter a title, choose a priority, and set a due date.
4. In **Board**, drag the task from **To Do** to **In Progress**. Open **Dashboard** to see the updated counts and deadline.

## 7. Implemented features

| Feature                         | Implementation                                                                                    | How to verify                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts                        | Registration, login, logout, Argon2id password hashing, and owner-based access.                   | Create a project as user A, then open its URL as user B. The API rejects the request.                                                              |
| Task management                 | Create, read, update, and delete tasks with a title, description, status, priority, and due date. | Create a task with **New Task**, select its title to edit it, then delete it from **List**.                                                        |
| Search, filters, and pagination | Search by title, combine status and priority filters, sort, and paginate.                         | In **List**, search for a title and apply both filters. To check pagination, use a project with at least six tasks and select five tasks per page. |
| Dashboard                       | Total tasks, counts by status, progress, and deadlines.                                           | Move a task from **In Progress** to **Done** and verify that both counts change.                                                                   |
| Kanban                          | Drag and drop between three status columns.                                                       | Move a card and reload the page to confirm its new status persists.                                                                                |
| Projects                        | Create, edit, delete, archive, and restore projects. Each project has its own statistics.         | Open **Overview** to inspect progress or select **Archive** to archive a project.                                                                  |
| Backend tests                   | Unit tests for input validation and HTTP integration tests against PostgreSQL.                    | Run `npm test` from `backend` using the [test setup](#9-backend-tests).                                                                            |
| API documentation               | OpenAPI and Swagger UI cover Health, Auth, Projects, Tasks, and Dashboard.                        | Create and read a task using the [Swagger UI walkthrough](#10-try-the-api-in-swagger-ui).                                                          |
| Public deployment               | Vercel serves the frontend and API on one domain.                                                 | Check the [production health endpoint](https://task-management-system-ten-black.vercel.app/api/v1/health) for database connectivity.               |

### Known limitations and outstanding work

- **Board** loads the first 100 tasks matching the current query. Use **List** to browse additional pages.
- **Upcoming Deadlines** shows up to eight unfinished tasks, sorted by due date from oldest to newest. Eight overdue tasks can fill the list and hide a task due tomorrow.
- Docker Compose and a CI test workflow are outstanding bonus features.

## 8. Call the API from PowerShell

Start the backend and register a local account. This example signs in, creates a project and a task, and searches for that task. PowerShell keeps the session cookie in `$taskSession`. Authenticated writes also require the `X-CSRF-Token` header from the login response.

```powershell
$api = 'http://localhost:3000/api/v1'
$account = Get-Credential -Message 'Enter the email and password for your local account'
$loginBody = @{
    email = $account.UserName
    password = $account.GetNetworkCredential().Password
} | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$api/auth/login" -ContentType 'application/json' -Body $loginBody -SessionVariable taskSession

$write = @{
    WebSession = $taskSession
    Headers = @{ 'X-CSRF-Token' = $login.csrfToken }
    ContentType = 'application/json'
}
$project = Invoke-RestMethod @write -Method Post -Uri "$api/projects" -Body '{"name":"API demo"}'
$tasksUrl = "$api/projects/$($project.project.id)/tasks"
$created = Invoke-RestMethod @write -Method Post -Uri $tasksUrl -Body '{"title":"Review checkout","status":"TODO","priority":"HIGH"}'
$list = Invoke-RestMethod -WebSession $taskSession -Uri "${tasksUrl}?search=checkout&status=TODO&priority=HIGH"
$list.tasks | Select-Object id, title, status, priority
```

The result contains `Review checkout` with status `TODO` and priority `HIGH`. Use `GET /api/v1/tasks/{id}` to read a task by ID. Requests to read or edit another user's task return `404`. A write with an invalid CSRF token returns `403`.

## 9. Backend tests

Run these commands from `backend` after installing dependencies and generating the Prisma Client. Unit tests and OpenAPI validation can run independently of the API server and PostgreSQL.

```powershell
npm run test:unit
npm run docs:check
```

For integration tests, create a separate PostgreSQL database such as `task_management_test`. Give its user permission to apply migrations. Copy the test environment template once.

```powershell
Copy-Item .env.test.example .env.test
```

Set `TEST_DATABASE_URL` in `backend/.env.test` to the connection string for that database, then run the full suite.

```powershell
npm test
```

The suite runs unit tests, HTTP integration tests, and OpenAPI validation. To run just the integration tests, use `npm run test:integration`. They apply migrations, start the API on an available local port, create accounts for each scenario, and clean up their data afterward. The suite runs without seed data. Git ignores `.env.test` and tracks the [test environment template](backend/.env.test.example).

Integration tests cover login and session revocation, access to another user's tasks, invalid CSRF tokens, task CRUD, dashboard counts, combined search and filters with pagination, and task creation in archived projects.

## 10. Try the API in Swagger UI

Start the backend and open [Swagger UI](http://localhost:3000/api/docs/). **Execute** sends requests to the running API, so writes affect its configured database. The [OpenAPI specification](backend/openapi.yaml) is also available at the [local specification endpoint](http://localhost:3000/api/openapi.yaml).

1. Under **Auth**, open `POST /auth/login`, choose **Try it out**, enter your local credentials, and select **Execute**. New users can start with `POST /auth/register`. The browser stores the session cookie. Copy `csrfToken` from the response.
2. Under **Projects**, open `POST /projects`, paste the token into `X-CSRF-Token`, enter a project name, and select **Execute**. Copy `project.id` from the `201` response.
3. Under **Tasks**, open `POST /projects/{projectId}/tasks`. Enter the project ID, CSRF token, and a task title. Execute the request and copy `task.id`.
4. Call `GET /tasks/{taskId}` with that ID. The `200` response contains the task you just created. When finished, call `POST /auth/logout` with the CSRF token to end the session.

## 11. Deploy to Vercel

1. Import the Git branch containing the root `vercel.json`. Select **Services** and keep **Root Directory** at `./`. The Vite frontend and Express API share the deployment domain.
2. In **Environment Variables**, set `DATABASE_URL` to the target Supabase pooler connection string and `CSRF_SECRET` to a stable random value. Generate the secret locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Use separate database credentials for disposable previews.
3. From `backend`, with `DATABASE_URL` pointing to the intended database, run `npx prisma migrate status --config prisma7.config.ts`. Apply pending migrations with `npx prisma migrate deploy --config prisma7.config.ts` before using the app.
4. Click **Deploy**. Open `/api/v1/health` and check for `{"status":"ok","database":"connected"}`. Reload `/login`, sign in, and open `/projects` to check the SPA and session. Swagger UI is at `/api/docs/`.

If a same-origin write returns `CSRF_ORIGIN_MISMATCH`, set `FRONTEND_ORIGIN` to the exact public HTTPS origin (without a trailing slash) for that environment and redeploy.
