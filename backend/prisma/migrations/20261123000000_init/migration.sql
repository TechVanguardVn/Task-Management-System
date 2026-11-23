-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    -- Email luôn lưu dạng chữ thường để unique không phân biệt hoa/thường
    CONSTRAINT "users_email_lowercase_chk" CHECK ("email" = lower("email")),
    CONSTRAINT "users_email_format_chk" CHECK ("email" ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT "users_name_not_blank_chk" CHECK (length(btrim("name")) > 0)
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sessions_expires_after_created_chk" CHECK ("expires_at" > "created_at")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "due_date" TIMESTAMPTZ(3),
    "tags" VARCHAR(30)[] DEFAULT ARRAY[]::VARCHAR(30)[],
    "position" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tasks_title_not_blank_chk" CHECK (length(btrim("title")) > 0),
    CONSTRAINT "tasks_description_length_chk" CHECK ("description" IS NULL OR length("description") <= 5000),
    CONSTRAINT "tasks_position_non_negative_chk" CHECK ("position" >= 0),
    CONSTRAINT "tasks_tags_max_10_chk" CHECK ("tags" IS NULL OR cardinality("tags") <= 10),
    -- completed_at chỉ có giá trị khi task đã DONE
    CONSTRAINT "tasks_completed_at_matches_status_chk" CHECK (
        ("status" = 'DONE' AND "completed_at" IS NOT NULL)
        OR ("status" <> 'DONE' AND "completed_at" IS NULL)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "tasks_user_id_status_position_idx" ON "tasks"("user_id", "status", "position");

-- CreateIndex
CREATE INDEX "tasks_user_id_priority_idx" ON "tasks"("user_id", "priority");

-- CreateIndex
CREATE INDEX "tasks_user_id_due_date_idx" ON "tasks"("user_id", "due_date");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
