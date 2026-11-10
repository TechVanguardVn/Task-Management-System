import assert from "node:assert/strict";
import { test } from "node:test";
import { registerSchema } from "../src/modules/auth/auth.schema";
import { createProjectSchema } from "../src/modules/projects/projects.schema";
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from "../src/modules/tasks/tasks.schema";

test("registration normalizes email and rejects short passwords", () => {
  const user = { name: "Test", email: "  TEST@EXAMPLE.TEST ", password: "sample-password" };
  assert.equal(registerSchema.parse(user).email, "test@example.test");
  assert.equal(registerSchema.safeParse({ ...user, password: "short" }).success, false);
});

test("a task requires a nonblank title and defaults to TODO, MEDIUM", () => {
  assert.equal(createTaskSchema.safeParse({ title: "  " }).success, false);
  const task = createTaskSchema.parse({ title: " Release " });
  assert.equal(task.title, "Release");
  assert.equal(task.status, "TODO");
  assert.equal(task.priority, "MEDIUM");
});

test("task dates must be valid calendar dates and updates must contain a writable field", () => {
  assert.equal(updateTaskSchema.safeParse({ dueDate: "2025-02-29" }).success, false);
  assert.equal(updateTaskSchema.safeParse({ dueDate: "2024-02-29" }).success, true);
  assert.equal(updateTaskSchema.safeParse({ dueDate: null }).success, true);
  assert.equal(updateTaskSchema.safeParse({}).success, false);
  assert.equal(updateTaskSchema.safeParse({ projectId: "someone-elses-project" }).success, false);
});

test("project deadline cannot precede the start date", () => {
  assert.equal(createProjectSchema.safeParse({
    name: "Release", startDate: "2026-03-10", dueDate: "2026-03-09",
  }).success, false);
});

test("task pagination accepts numeric query strings and enforces the page bounds", () => {
  assert.equal(listTasksQuerySchema.parse({ page: "2" }).page, 2);
  assert.equal(listTasksQuerySchema.safeParse({ page: "0" }).success, false);
  assert.equal(listTasksQuerySchema.safeParse({ limit: "101" }).success, false);
});
