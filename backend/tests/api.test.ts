import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test, type TestContext } from "node:test";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

let server: Server | undefined;
let baseUrl: string;
let prisma: typeof import("../src/db").prisma;

function databaseIdentity(connectionString: string) {
  const url = new URL(connectionString);
  return [url.hostname, url.port || "5432", url.pathname].join("/");
}

before(async () => {
  config({ path: ".env", quiet: true });
  const applicationUrl = process.env.DATABASE_URL;
  config({ path: ".env.test", quiet: true });
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error("Set TEST_DATABASE_URL in backend/.env.test to a separate PostgreSQL database.");
  }
  if (applicationUrl && databaseIdentity(testUrl) === databaseIdentity(applicationUrl)) {
    throw new Error("Use a separate database for TEST_DATABASE_URL and DATABASE_URL.");
  }
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testUrl;
  const cli = fileURLToPath(import.meta.resolve("prisma/build/index.js"));
  execFileSync(process.execPath, [cli, "migrate", "deploy", "--config", "prisma7.config.ts"], {
    stdio: "inherit",
  });
  // Load Prisma only after selecting the test database.
  const { app } = await import("../src/app");
  ({ prisma } = await import("../src/db"));
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => server!.close(err => err ? reject(err) : resolve()));
  }
  await prisma?.$disconnect();
});

interface Session {
  cookie: string;
  csrf: string;
}

async function request(method: string, path: string, status: number, session?: Session, body?: object) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(session && { Cookie: session.cookie, "X-CSRF-Token": session.csrf }),
    },
    body: body && JSON.stringify(body),
  });
  assert.equal(response.status, status, `${method} ${path} returned ${response.status}`);
  return response;
}

async function sessionFrom(response: Response): Promise<Session> {
  const data = await response.json();
  const cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  assert.match(cookie, /tms_session=/);
  assert.ok(data.csrfToken);
  return { cookie, csrf: data.csrfToken };
}

async function account(t: TestContext) {
  const credentials = { email: `${randomUUID()}@example.test`, password: randomUUID() };
  t.after(async () => {
    await prisma.user.deleteMany({ where: { email: credentials.email } });
  });
  const response = await request("POST", "/auth/register", 201, undefined, { name: "Test", ...credentials });
  return { credentials, session: await sessionFrom(response) };
}

async function projectTasks(session: Session) {
  const response = await request("POST", "/projects", 201, session, { name: "Test project" });
  const { project } = await response.json();
  return `/projects/${project.id}/tasks`;
}

test("login creates a usable session and logout revokes it", async (t) => {
  const { credentials } = await account(t);
  await request("POST", "/auth/login", 401, undefined, { ...credentials, password: "wrong" });
  const login = await sessionFrom(await request("POST", "/auth/login", 200, undefined, credentials));
  const me = await (await request("GET", "/auth/me", 200, login)).json();
  assert.equal(me.user.email, credentials.email);
  await request("POST", "/auth/logout", 200, login);
  await request("GET", "/auth/me", 401, login);
});

test("a second account cannot read or modify another user's task, and writes require valid CSRF", async (t) => {
  const { session: owner } = await account(t);
  const { session: outsider } = await account(t);
  const path = await projectTasks(owner);
  const { task } = await (await request("POST", path, 201, owner, { title: "Private" })).json();
  const url = `/tasks/${task.id}`;
  await request("GET", path, 404, outsider);
  await request("GET", url, 404, outsider);
  await request("PATCH", url, 404, outsider, { title: "changed" });
  await request("PATCH", url, 403, { ...owner, csrf: "invalid" }, { title: "changed" });
  assert.equal((await (await request("GET", url, 200, owner)).json()).task.title, "Private");
});

test("task CRUD updates dashboard totals and deadlines", async (t) => {
  const { session } = await account(t);
  const path = await projectTasks(session);
  const { task } = await (await request("POST", path, 201, session, {
    title: "Release", status: "IN_PROGRESS", dueDate: "2099-01-01",
  })).json();
  const url = `/tasks/${task.id}`;
  const metrics = async () => (await (await request("GET", "/dashboard/summary", 200, session)).json()).metrics;
  const upcoming = async () => (await (await request("GET", "/dashboard/upcoming-tasks", 200, session)).json()).tasks;
  assert.equal((await metrics()).inProgressTasks, 1);
  assert.equal((await upcoming())[0].id, task.id);
  await request("PATCH", url, 200, session, { status: "DONE" });
  const { task: done } = await (await request("GET", url, 200, session)).json();
  assert.equal(done.status, "DONE");
  assert.ok(done.completedAt);
  const summary = await metrics();
  assert.equal(summary.inProgressTasks, 0);
  assert.equal(summary.doneTasks, 1);
  assert.equal(summary.totalTasks, 1);
  assert.equal((await upcoming()).length, 0);
  await request("DELETE", url, 200, session);
  await request("GET", url, 404, session);
  assert.equal((await metrics()).totalTasks, 0);
});

test("task search, status and priority filters apply before pagination", async (t) => {
  const { session } = await account(t);
  const path = await projectTasks(session);
  for (const [title, status, priority] of [
    ["Release A", "TODO", "HIGH"], ["Release B", "TODO", "HIGH"],
    ["Release C", "DONE", "HIGH"], ["Release D", "TODO", "LOW"], ["Other", "TODO", "HIGH"],
  ]) {
    await request("POST", path, 201, session, { title, status, priority });
  }
  const query = "?search=release&priority=HIGH&status=TODO&sortBy=title&sortOrder=asc&limit=1&page=2";
  const { tasks, pagination } = await (await request("GET", path + query, 200, session)).json();
  assert.deepEqual(tasks.map((task: { title: string }) => task.title), ["Release B"]);
  assert.deepEqual(pagination, { page: 2, limit: 1, total: 2, totalPages: 2 });
});

test("archived projects reject new tasks until restored", async (t) => {
  const { session } = await account(t);
  const tasksPath = await projectTasks(session);
  const projectPath = tasksPath.slice(0, -"/tasks".length);
  await request("PATCH", projectPath, 200, session, { status: "ARCHIVED" });
  const error = await (await request("POST", tasksPath, 409, session, { title: "Blocked" })).json();
  assert.equal(error.error.code, "PROJECT_ARCHIVED");
  await request("PATCH", projectPath, 200, session, { status: "ACTIVE" });
  await request("POST", tasksPath, 201, session, { title: "Allowed" });
});
