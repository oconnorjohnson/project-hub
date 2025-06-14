CREATE TYPE "public"."access_level" AS ENUM('read', 'reference', 'collaborate');--> statement-breakpoint
CREATE TYPE "public"."project_reference_type" AS ENUM('DEPENDENCY', 'BLOCKS', 'RELATED', 'SUBTASK');--> statement-breakpoint
CREATE TYPE "public"."workspace_reference_type" AS ENUM('DEPENDENCY', 'COLLABORATION', 'PARENT_CHILD');--> statement-breakpoint
CREATE TABLE "cross_workspace_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" uuid NOT NULL,
	"granted_by_workspace_id" uuid NOT NULL,
	"access_level" "access_level" NOT NULL,
	"granted_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_project_id" uuid NOT NULL,
	"target_project_id" uuid NOT NULL,
	"reference_type" "project_reference_type" NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_workspace_id" uuid NOT NULL,
	"target_workspace_id" uuid NOT NULL,
	"reference_type" "workspace_reference_type" NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cross_workspace_permissions" ADD CONSTRAINT "cross_workspace_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_workspace_permissions" ADD CONSTRAINT "cross_workspace_permissions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_workspace_permissions" ADD CONSTRAINT "cross_workspace_permissions_granted_by_workspace_id_workspaces_id_fk" FOREIGN KEY ("granted_by_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_workspace_permissions" ADD CONSTRAINT "cross_workspace_permissions_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_references" ADD CONSTRAINT "project_references_source_project_id_projects_id_fk" FOREIGN KEY ("source_project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_references" ADD CONSTRAINT "project_references_target_project_id_projects_id_fk" FOREIGN KEY ("target_project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_references" ADD CONSTRAINT "project_references_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_references" ADD CONSTRAINT "workspace_references_source_workspace_id_workspaces_id_fk" FOREIGN KEY ("source_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_references" ADD CONSTRAINT "workspace_references_target_workspace_id_workspaces_id_fk" FOREIGN KEY ("target_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_references" ADD CONSTRAINT "workspace_references_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;