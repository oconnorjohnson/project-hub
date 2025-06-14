CREATE TYPE "public"."event_type" AS ENUM('MEETING', 'DEADLINE', 'MILESTONE', 'REMINDER', 'BLOCK');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "artifacts" ALTER COLUMN "project_id" DROP NOT NULL;