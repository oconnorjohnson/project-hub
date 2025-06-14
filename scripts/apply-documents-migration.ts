import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function applyDocumentsMigration() {
  try {
    console.log("Applying documents migration...");

    // Create documents table
    await client`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" text NOT NULL,
        "content" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "project_id" uuid,
        "created_by" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;

    // Create document_locks table
    await client`
      CREATE TABLE IF NOT EXISTS "document_locks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "document_id" uuid NOT NULL,
        "locked_by" text NOT NULL,
        "locked_at" timestamp DEFAULT now() NOT NULL,
        "expires_at" timestamp NOT NULL
      );
    `;

    // Create document_versions table
    await client`
      CREATE TABLE IF NOT EXISTS "document_versions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "document_id" uuid NOT NULL,
        "content" jsonb NOT NULL,
        "version_number" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "created_by" text NOT NULL
      );
    `;

    // Add foreign key constraints
    await client`
      ALTER TABLE "documents" 
      ADD CONSTRAINT IF NOT EXISTS "documents_project_id_projects_id_fk" 
      FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    `;

    await client`
      ALTER TABLE "documents" 
      ADD CONSTRAINT IF NOT EXISTS "documents_created_by_users_id_fk" 
      FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    `;

    await client`
      ALTER TABLE "document_locks" 
      ADD CONSTRAINT IF NOT EXISTS "document_locks_document_id_documents_id_fk" 
      FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
    `;

    await client`
      ALTER TABLE "document_versions" 
      ADD CONSTRAINT IF NOT EXISTS "document_versions_document_id_documents_id_fk" 
      FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
    `;

    await client`
      ALTER TABLE "document_versions" 
      ADD CONSTRAINT IF NOT EXISTS "document_versions_created_by_users_id_fk" 
      FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    `;

    console.log("Documents migration applied successfully!");
  } catch (error) {
    console.error("Error applying migration:", error);
  } finally {
    await client.end();
  }
}

applyDocumentsMigration();
