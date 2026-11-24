-- Reviewed from docs/database-schema.sql. Flyway owns the transaction.
SET LOCAL search_path = public, pg_catalog;

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(254) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(32),
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" DATE,
    "due_date" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "due_date" DATE,
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "projects_owner_id_status_idx" ON "projects"("owner_id", "status");

-- CreateIndex
CREATE INDEX "tasks_project_id_status_idx" ON "tasks"("project_id", "status");

-- CreateIndex
CREATE INDEX "tasks_project_id_priority_idx" ON "tasks"("project_id", "priority");

-- CreateIndex
CREATE INDEX "tasks_project_id_due_date_idx" ON "tasks"("project_id", "due_date");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE users
    ADD CONSTRAINT users_email_normalized CHECK (email <> '' AND email = lower(btrim(email))),
    ADD CONSTRAINT users_name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE sessions
    ADD CONSTRAINT sessions_expiry_after_creation CHECK (expires_at > created_at);

ALTER TABLE projects
    ADD CONSTRAINT projects_name_not_blank CHECK (btrim(name) <> ''),
    ADD CONSTRAINT projects_date_order CHECK (due_date >= start_date);

ALTER TABLE tasks
    ADD CONSTRAINT tasks_title_not_blank CHECK (btrim(title) <> '');

-- Lock both parents in UUID order. NOWAIT prevents child-to-parent lock waits
-- and lock-upgrade deadlocks; callers must retry the entire transaction on 55P03.
-- NO KEY UPDATE also serializes task writers per project and conflicts with archive updates.
CREATE FUNCTION public.prepare_task_write() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE
    project_status public."ProjectStatus";
    previous_project uuid;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        previous_project := OLD.project_id;
    END IF;
    FOR project_status IN
        SELECT status FROM public.projects
        WHERE id IN (NEW.project_id, previous_project)
        ORDER BY id FOR NO KEY UPDATE NOWAIT
    LOOP
        IF project_status = 'ARCHIVED' THEN
            RAISE EXCEPTION 'Cannot create or update tasks in an archived project'
                USING ERRCODE = '23514', CONSTRAINT = 'tasks_project_active';
        END IF;
    END LOOP;

    IF NEW.status <> 'DONE' THEN
        NEW.completed_at := NULL;
    ELSIF TG_OP = 'INSERT' OR OLD.status <> 'DONE' THEN
        NEW.completed_at := statement_timestamp();
    ELSE
        NEW.completed_at := OLD.completed_at;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_before_write BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION public.prepare_task_write();

-- Keep trigger-generated timestamps authoritative for both SQL and JPA writes.
CREATE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
    NEW.updated_at := statement_timestamp();
    NEW.created_at := OLD.created_at;
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_touch_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER projects_touch_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tasks_touch_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.users
    ADD CONSTRAINT users_password_hash_not_blank CHECK (btrim(password_hash) <> '');
ALTER TABLE public.sessions
    ADD CONSTRAINT sessions_token_hash_not_blank CHECK (btrim(token_hash) <> '');
ALTER TABLE public.projects
    ADD CONSTRAINT projects_description_length CHECK (char_length(description) <= 10000);
ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_description_length CHECK (char_length(description) <= 10000),
    ADD CONSTRAINT tasks_completion_consistent CHECK ((status = 'DONE') = (completed_at IS NOT NULL));

-- Prefix searches: WHERE owner_id/project_id = ? AND lower(name/title) LIKE 'prefix%'.
-- These do not accelerate '%substring%' searches; no extension privilege is needed.
CREATE INDEX projects_owner_name_search_idx ON public.projects (owner_id, lower(name) text_pattern_ops);
CREATE INDEX tasks_project_title_search_idx ON public.tasks (project_id, lower(title) text_pattern_ops);

-- The backend sets this from a verified principal with set_config(..., true)
-- INSIDE each transaction. Missing identity denies all rows, including to owners.
CREATE FUNCTION public.current_app_user_id() RETURNS uuid
LANGUAGE sql STABLE SET search_path = pg_catalog AS $$
    SELECT nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;

CREATE POLICY users_ownership ON public.users
    USING (id = public.current_app_user_id())
    WITH CHECK (id = public.current_app_user_id());
CREATE POLICY sessions_ownership ON public.sessions
    USING (user_id = public.current_app_user_id())
    WITH CHECK (user_id = public.current_app_user_id());
CREATE POLICY projects_ownership ON public.projects
    USING (owner_id = public.current_app_user_id())
    WITH CHECK (owner_id = public.current_app_user_id());
CREATE POLICY tasks_ownership ON public.tasks
    USING (EXISTS (SELECT 1 FROM public.projects p
                   WHERE p.id = project_id AND p.owner_id = public.current_app_user_id()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p
                        WHERE p.id = project_id AND p.owner_id = public.current_app_user_id()));

REVOKE ALL ON TABLE public.users, public.sessions, public.projects, public.tasks FROM PUBLIC;
-- Supabase may give API roles default table privileges. The backend owns access.
DO $$
DECLARE api_role text;
BEGIN
    FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
        IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = api_role) THEN
            EXECUTE format('REVOKE ALL ON TABLE public.users, public.sessions, public.projects, public.tasks FROM %I', api_role);
        END IF;
    END LOOP;
END;
$$;
